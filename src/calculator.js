/**
 * Pure arithmetic core of the KriptoStream DLT calculator.
 *
 * Deliberately free of I/O and of third-party dependencies: everything here is a
 * total function of its arguments, which is what makes the unit tests meaningful.
 */

export class CalculationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CalculationError';
  }
}

const OPERATIONS = Object.freeze({
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => {
    if (b === 0) throw new CalculationError('division by zero is undefined');
    return a / b;
  },
  '%': (a, b) => {
    if (b === 0) throw new CalculationError('modulo by zero is undefined');
    return a % b;
  },
  '^': (a, b) => {
    if (b < 0) throw new CalculationError('negative exponents do not yield integers');
    return a ** b;
  },
});

/** The operators the calculator accepts, in menu order. */
export const OPERATORS = Object.freeze(Object.keys(OPERATIONS));

/**
 * Apply `operator` to two integers.
 *
 * @param {number} a        left operand, must be a safe integer
 * @param {string} operator one of {@link OPERATORS}
 * @param {number} b        right operand, must be a safe integer
 * @returns {number}        the result (`/` may return a non-integer)
 * @throws {CalculationError} on an unknown operator or an undefined result
 */
export function calculate(a, operator, b) {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
    throw new CalculationError('both operands must be safe integers');
  }

  const operation = OPERATIONS[operator];
  if (!operation) {
    throw new CalculationError(
      `unknown operator "${operator}" - expected one of ${OPERATORS.join(' ')}`,
    );
  }

  const result = operation(a, b);

  // Overflow past 2^53 silently loses precision, which for a financial data
  // feed is worse than refusing to answer.
  if (!Number.isFinite(result)) {
    throw new CalculationError('result is not a finite number');
  }
  if (Number.isInteger(result) && !Number.isSafeInteger(result)) {
    throw new CalculationError('result exceeds the safe integer range');
  }

  return result;
}
