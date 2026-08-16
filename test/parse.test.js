import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { parseInteger, parseOperator, ParseError } from '../src/parse.js';

describe('parseInteger', () => {
  test('parses plain integers', () => {
    assert.equal(parseInteger('42'), 42);
    assert.equal(parseInteger('0'), 0);
  });

  test('parses signed integers', () => {
    assert.equal(parseInteger('-17'), -17);
    assert.equal(parseInteger('+17'), 17);
  });

  test('tolerates surrounding whitespace', () => {
    assert.equal(parseInteger('  7  '), 7);
    assert.equal(parseInteger('\t-3\n'), -3);
  });

  test('rejects blank input', () => {
    assert.throws(() => parseInteger(''), { name: 'ParseError', message: /enter an integer/ });
    assert.throws(() => parseInteger('   '), { name: 'ParseError' });
  });

  test('rejects non-numeric input', () => {
    assert.throws(() => parseInteger('abc'), { name: 'ParseError', message: /not an integer/ });
    assert.throws(() => parseInteger('12abc'), { name: 'ParseError' });
  });

  test('rejects decimals rather than silently truncating', () => {
    assert.throws(() => parseInteger('1.5'), { name: 'ParseError' });
    assert.throws(() => parseInteger('1.0'), { name: 'ParseError' });
  });

  test('rejects notations Number() would quietly reinterpret', () => {
    assert.throws(() => parseInteger('0x1f'), { name: 'ParseError' });
    assert.throws(() => parseInteger('1e3'), { name: 'ParseError' });
    assert.throws(() => parseInteger('Infinity'), { name: 'ParseError' });
  });

  test('rejects integers beyond the safe range', () => {
    assert.throws(() => parseInteger('9007199254740993'), {
      name: 'ParseError',
      message: /safe integer range/,
    });
  });

  test('accepts the safe integer boundary', () => {
    assert.equal(parseInteger('9007199254740991'), Number.MAX_SAFE_INTEGER);
  });
});

describe('parseOperator', () => {
  test('accepts every supported operator', () => {
    for (const operator of ['+', '-', '*', '/', '%', '^']) {
      assert.equal(parseOperator(operator), operator);
    }
  });

  test('tolerates surrounding whitespace', () => {
    assert.equal(parseOperator('  *  '), '*');
  });

  test('rejects blank input', () => {
    assert.throws(() => parseOperator('  '), {
      name: 'ParseError',
      message: /enter an operator/,
    });
  });

  test('rejects unsupported operators', () => {
    assert.throws(() => parseOperator('**'), {
      name: 'ParseError',
      message: /not a supported operator/,
    });
    assert.throws(() => parseOperator('add'), { name: 'ParseError' });
  });

  test('ParseError is an Error subclass', () => {
    const error = new ParseError('boom');
    assert.ok(error instanceof Error);
    assert.equal(error.name, 'ParseError');
  });
});
