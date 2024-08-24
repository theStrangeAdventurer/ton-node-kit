// Import necessary functions and types from @ton/ton
import { fromNano, type Transaction } from '@ton/ton';

/**
 * Executes a function with retries on failure.
 * @template T The types of the parameters for the function fn.
 * @template U The return type of the function fn.
 * @param {(...args: T[]) => U} fn The function to execute.
 * @param {number} retries The number of retries before giving up.
 * @param {number} delay The delay between retries in milliseconds.
 * @returns {Promise<U>} The result of the function fn.
 */
export async function withRetry<T, U>(
  fn: (...args: T[]) => U,
  retries = 3,
  delay = 1000,
) {
  for (let i = 0; i < retries; i++) {
    try {
      return fn();
    } catch (e) {
      // On the last retry, throw the error
      if (i === retries - 1) throw e;
      // Wait for a specified delay before retrying
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/**
 * Retrieves the sender address from a transaction.
 * @param {Transaction} tx The transaction from which to retrieve the sender address.
 * @returns {string | undefined} The sender address, if available.
 */
export function getTxSender(tx: Transaction) {
  const inMsg = tx.inMessage;
  return inMsg?.info.src;
}

type GetTxValueAmountOptions =
  | { currency?: 'ton' }
  | { currency?: 'nano'; returnBigint?: boolean };

/**
 * Retrieves the currency amount (in TON or NanoTON) from a transaction.
 * @param {Transaction} tx The transaction to parse.
 * @param {GetTxValueAmountOptions} options Options for fetching the amount.
 * @returns {string | bigint} The amount in the specified currency.
 * @throws Will throw an error if the currency cannot be retrieved.
 */
export function getTxValueAmount(
  tx: Transaction,
  options: GetTxValueAmountOptions = { currency: 'ton' },
) {
  // @ts-expect-error expect value exists
  const rawValue = tx.inMessage?.info.value?.coins;

  if (!rawValue) throw new Error("Can't get currency from transaction");

  const { currency } = options;

  // Convert currency based on requested type
  switch (currency) {
    case 'ton':
      return fromNano(rawValue);
    case 'nano':
      // Option to return raw bigint or its string representation
      return options.returnBigint ? (rawValue as bigint) : String(rawValue);
    default:
      throw new Error(`unknown currency ${currency}`);
  }
}

/**
 * Extracts the comment text from a transaction.
 * @param {Transaction} tx The transaction from which to extract the comment.
 * @returns {string} The extracted comment text.
 * @throws Will throw an error if the operation is not 0 or if the conversion fails.
 */
export function getTxComment(tx: Transaction) {
  const originalBody = tx.inMessage?.body.beginParse();
  const body = originalBody?.clone();

  // Validate operation code
  const op = body?.loadUint(32);
  if (op !== 0) {
    throw new Error("op != 0, can't get tx message");
  }

  const hexString = body?.toString();
  if (typeof hexString !== 'string')
    throw new Error(`Expected hex string, got: ${hexString}`);

  // Convert hex string to byte array
  const byteArray = [];
  for (let i = 0; i < hexString.length; i += 2) {
    byteArray.push(parseInt(hexString.substring(i, i + 2), 16));
  }
  // Decode the byte array to string using a UTF-8 decoder
  const decoder = new TextDecoder();
  const commentText = decoder.decode(new Uint8Array(byteArray));
  // Trim NULL bytes from the start and end of the comment text
  return commentText.replace(/^\x00+|\x00+$/g, '');
}
