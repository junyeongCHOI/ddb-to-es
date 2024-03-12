# DDBToES: Sync DynamoDB Streams to Elasticsearch

The DDBToES class provides a seamless way to synchronize changes from DynamoDB streams to Elasticsearch. This document serves as a guide to help you set up and utilize this functionality in your projects.

## Features

- **Bulk Synchronization**: Handles large sets of DynamoDB records by chunking and synchronizing them in bulk to Elasticsearch.
- **Resilient Error Handling**: Utilizes exponential backoff for error handling to manage transient network issues or service downtime.
- **Configurable**: Allows customization of the Elasticsearch index, authentication, bulk size, and more.

## Usage

```bash
npm install ddb-to-es
```

```js
const configs = {
  es: {
    endPoint: 'https://your-es-domain.region.es.amazonaws.com',
    username: 'your_username',
    password: 'your_password',
  },
  maxRetry: 3,
  esRefresh: true,
  bulkSize: 100, // Number of records to send per bulk request to Elasticsearch
  setIndex: (oldImage, newImage) => 'your_index_name', // Logic to determine the index name
  httpsAgent: new https.Agent({
    /* your https configuration */
  }),
};

const ddbToEs = new DDBToES(configs);

exports.handler = async (event) => {
  const records = event.Records;
  const results = await ddbToEs.sync(records);
  console.log(results);
};
```

**Error Handling**: The sync method returns detailed information about each bulk request, including any errors. Use this information to implement error handling or logging as needed.
