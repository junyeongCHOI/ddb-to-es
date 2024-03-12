import { unmarshall } from '@aws-sdk/util-dynamodb';
import axios, { AxiosError } from 'axios';
import { Configs, DynamoDBRecord } from './types';
import { chunkArray, exponentialBackoff } from './utils';

export class DDBToES<T> {
  configs: Configs;

  constructor(configs: Configs) {
    this.configs = configs;
  }

  async sync(records: DynamoDBRecord[]) {
    const results: { data?: any; error?: any }[] = [];
    const chunk = chunkArray(records, this.configs.bulkSize || 100);

    for (const records of chunk) {
      const { remove, upsert } = this.getESBody(records);

      const body = [
        ...remove.flatMap((doc) => [{ delete: { _index: doc.index, _id: doc.id } }]),
        ...upsert.flatMap((doc) => [{ index: { _index: doc.index, _id: doc.id } }, doc.body]),
      ];

      if (body.length > 0) {
        try {
          const result = await exponentialBackoff(() => this.bulk(body), this.configs.maxRetry === undefined ? 3 : this.configs.maxRetry);
          results.push(result);
        } catch (error) {
          results.push({
            error,
          });
        }
      }
    }

    return results;
  }

  private async bulk(body: Record<string, any>[]) {
    const stringifiedBody = body.map((d) => JSON.stringify(d)).join('\n') + '\n';

    try {
      const { data } = await axios.post(`${this.configs.es.endPoint}/_bulk?refresh=${this.configs.esRefresh === true ? 'true' : 'false'}`, stringifiedBody, {
        headers: {
          'Content-Type': 'application/x-ndjson',
        },
        httpsAgent: this.configs.httpsAgent,
        auth: {
          username: this.configs.es.username,
          password: this.configs.es.password,
        },
      });

      return { data };
    } catch (error: unknown) {
      const _e = error as AxiosError;

      // should retry
      if (!_e.response?.status || [502, 503, 504].includes(_e.response.status)) {
        throw _e;
      }

      return { error };
    }
  }

  private getESBody(records: DynamoDBRecord[]) {
    const remove: any[] = [];
    const upsert: any[] = [];

    for (const record of records) {
      const index = this.configs.setIndex(record.dynamodb?.OldImage, record.dynamodb?.NewImage);
      const keys = unmarshall(record.dynamodb!.Keys as any);
      const id = Object.values(keys).reduce((acc, curr) => acc.concat(curr), '');

      switch (record.eventName) {
        case 'REMOVE':
          remove.push({ index, id });
          break;
        case 'MODIFY':
        case 'INSERT':
          const body = this.unwrap(record.dynamodb!.NewImage);
          if (body) upsert.push(body);
          break;
      }
    }

    return { remove, upsert };
  }

  private unwrap(image: any): null | T {
    if (!image) return null;

    const data = unmarshall(image, {
      wrapNumbers: true, // escape bigint
    });

    // remove ddb data
    delete data.SequenceNumber;
    delete data.SizeBytes;
    delete data.StreamViewType;

    if (!data || data.constructor.name !== 'Object' || Object.keys(data).length === 0) return null;

    return data as T;
  }
}
