/**
 * Input validation for the KriptoStream DLT calculator.
 *
 * This is where lodash earns its place in the dependency tree - and, in Lab 5,
 * where the deliberately vulnerable downgrade to lodash@4.16.11 lands.
 */

import _ from 'lodash';
import { OPERATORS } from './calculator.js';

export class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParseError';
  }
}

// Strict integer form. Number()/_.toNumber() would happily accept "0x1f",
// "1e3" and "1.0"; a calculator that silently reinterprets its input is a
// calculator nobody should trust with financial data.
const INTEGER_PATTERN = /^[+-]?\d+$/;

/**
 * Parse a line of user input into a safe integer.
 *
 * @param {string} raw the raw line, leading/trailing whitespace tolerated
 * @returns {number}
 * @throws {ParseError} if the input is blank, malformed, or out of range
 */
export function parseInteger(raw) {
  const value = _.trim(_.toString(raw));

  if (_.isEmpty(value)) {
    throw new ParseError('please enter an integer');
  }
  if (!INTEGER_PATTERN.test(value)) {
    throw new ParseError(`"${value}" is not an integer`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new ParseError(`"${value}" is outside the safe integer range`);
  }

  return parsed;
}

/**
 * Parse a line of user input into a supported operator.
 *
 * @param {string} raw the raw line, leading/trailing whitespace tolerated
 * @returns {string} one of the supported operators
 * @throws {ParseError} if the operator is unknown
 */
export function parseOperator(raw) {
  const value = _.trim(_.toString(raw));

  if (_.isEmpty(value)) {
    throw new ParseError(`please enter an operator: ${OPERATORS.join(' ')}`);
  }
  if (!_.includes(OPERATORS, value)) {
    throw new ParseError(
      `"${value}" is not a supported operator - expected one of ${OPERATORS.join(' ')}`,
    );
  }

  return value;
}
