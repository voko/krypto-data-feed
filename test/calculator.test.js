import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { calculate, CalculationError, OPERATORS } from '../src/calculator.js';

describe('OPERATORS', () => {
  test('exposes the six supported operators in menu order', () => {
    assert.deepEqual([...OPERATORS], ['+', '-', '*', '/', '%', '^']);
  });

  test('is frozen so callers cannot mutate the menu', () => {
    assert.ok(Object.isFrozen(OPERATORS));
  });
});

describe('calculate', () => {
  test('adds', () => {
    assert.equal(calculate(2, '+', 3), 5);
    assert.equal(calculate(-7, '+', 7), 0);
  });

  test('subtracts', () => {
    assert.equal(calculate(10, '-', 4), 6);
    assert.equal(calculate(4, '-', 10), -6);
  });

  test('multiplies', () => {
    assert.equal(calculate(6, '*', 7), 42);
    assert.equal(calculate(-3, '*', 3), -9);
    assert.equal(calculate(0, '*', 99), 0);
  });

  test('divides, including non-integer results', () => {
    assert.equal(calculate(9, '/', 3), 3);
    assert.equal(calculate(7, '/', 2), 3.5);
    assert.equal(calculate(-8, '/', 2), -4);
  });

  test('takes the modulo', () => {
    assert.equal(calculate(10, '%', 3), 1);
    assert.equal(calculate(9, '%', 3), 0);
  });

  test('raises to a power', () => {
    assert.equal(calculate(2, '^', 10), 1024);
    assert.equal(calculate(5, '^', 0), 1);
  });
});

describe('calculate - error handling', () => {
  test('refuses division by zero', () => {
    assert.throws(() => calculate(1, '/', 0), {
      name: 'CalculationError',
      message: /division by zero/,
    });
  });

  test('refuses modulo by zero', () => {
    assert.throws(() => calculate(1, '%', 0), {
      name: 'CalculationError',
      message: /modulo by zero/,
    });
  });

  test('refuses negative exponents', () => {
    assert.throws(() => calculate(2, '^', -1), {
      name: 'CalculationError',
      message: /negative exponents/,
    });
  });

  test('rejects an unknown operator', () => {
    assert.throws(() => calculate(1, '**', 2), {
      name: 'CalculationError',
      message: /unknown operator/,
    });
  });

  test('rejects non-integer operands', () => {
    assert.throws(() => calculate(1.5, '+', 2), { name: 'CalculationError' });
    assert.throws(() => calculate(1, '+', Number.NaN), { name: 'CalculationError' });
  });

  test('rejects a result that would lose integer precision', () => {
    assert.throws(() => calculate(2, '^', 60), {
      name: 'CalculationError',
      message: /safe integer range/,
    });
  });

  test('CalculationError is an Error subclass', () => {
    const error = new CalculationError('boom');
    assert.ok(error instanceof Error);
    assert.equal(error.name, 'CalculationError');
  });
});
