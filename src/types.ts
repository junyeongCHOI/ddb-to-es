import type { Agent } from 'https';

export type DDBEventName = 'REMOVE' | 'MODIFY' | 'INSERT';

export type AttributeValue = {
  B?: string | undefined;
  BS?: string[] | undefined;
  BOOL?: boolean | undefined;
  L?: AttributeValue[] | undefined;
  M?: { [id: string]: AttributeValue } | undefined;
  N?: string | undefined;
  NS?: string[] | undefined;
  NULL?: boolean | undefined;
  S?: string | undefined;
  SS?: string[] | undefined;
};

export type DDBImage = Record<string, AttributeValue> | undefined;

export type StreamRecord = {
  ApproximateCreationDateTime?: number | undefined;
  Keys?: { [key: string]: AttributeValue } | undefined;
  NewImage?: { [key: string]: AttributeValue } | undefined;
  OldImage?: { [key: string]: AttributeValue } | undefined;
  SequenceNumber?: string | undefined;
  SizeBytes?: number | undefined;
  StreamViewType?: 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | undefined;
};

export type DynamoDBRecord = {
  awsRegion?: string | undefined;
  dynamodb?: StreamRecord | undefined;
  eventID?: string | undefined;
  eventName?: DDBEventName | undefined;
  eventSource?: string | undefined;
  eventSourceARN?: string | undefined;
  eventVersion?: string | undefined;
  userIdentity?: any;
};

export type Configs = {
  setIndex: (oldImage: DDBImage, newImage: DDBImage) => string;
  ignore?: DDBEventName[];
  bulkSize?: number;
  httpsAgent?: Agent;
  esRefresh?: boolean;
  maxRetry?: number;
  es: {
    endPoint: string;
    username: string;
    password: string;
  };
};
