# ton-node-kit

[![npm version](https://img.shields.io/npm/v/ton-node-kit)](https://www.npmjs.com/package/ton-node-kit)

Useful utilities for working with TON in NodeJS

## Install

```sh
npm install ton-node-kit
```

## Usage

```typescript
import { Address, TonClient } from '@ton/ton';
import type { Transaction } from '@ton/ton';

import {
  getTxComment,
  getTxSender,
  getTxValueAmount,
  withRetry,
  checkIsInternal,
} from 'ton-node-kit';

const myAddress = Address.parse('<your-wallet-address>');

const client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
  apiKey: process.env.TON_API_KEY,
});

const TRANSACTION_LIMIT = 1;
const RETRY_LIMIT = 30;
const RETRY_DELAY_MS = 100;

const getTransactions = async () => {
  return (await withRetry(
    () =>
      client.getTransactions(myAddress, {
        limit: TRANSACTION_LIMIT,
        archival: true,
      }),
    RETRY_LIMIT,
    RETRY_DELAY_MS,
  )) as Transaction[];
};

const transactions = await getTransactions();

for (const tx of transactions) {
  if (checkIsInternal(tx)) {
    const commentText = getTxComment(tx);
    const tonValue = getTxValueAmount(tx);
    const nanoValue = getTxValueAmount(tx, {
      currency: 'nano',
      returnBigint: true,
    });
    const sender = getTxSender(tx);
    const hexAddress = getTxSender(tx, { hex: true });

    console.log('Transaction', {
      commentText,
      tonValue,
      nanoValue,
      sender,
      hexAddress,
    });
  }

  // Transaction {
  //   commentText: 'Hello, TON!',
  //   nanoValue: 50000000n,
  //   tonValue: '0.05'
  //   sender: <sender-object>,
  //   hexAddress: '0:....'
  // }
}
```
