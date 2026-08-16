#!/usr/bin/env node
/**
 * KriptoStream DLT Data Feed - interactive calculator.
 *
 * Prompts for two integers and an operator, prints the result, and repeats
 * forever. Ctrl-C (or EOF) exits cleanly.
 *
 * This module is the thin I/O shell; all the logic worth testing lives in
 * ./calculator.js and ./parse.js.
 */

import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import pc from 'picocolors';

import { calculate, CalculationError, OPERATORS } from './calculator.js';
import { parseInteger, parseOperator, ParseError } from './parse.js';

/** Raised when stdin is exhausted or the user interrupts. */
class EndOfInput extends Error {
  constructor() {
    super('end of input');
    this.name = 'EndOfInput';
  }
}

const rl = createInterface({ input: stdin, output: stdout, terminal: stdin.isTTY });

// Lines are pulled one at a time from the async iterator rather than pushed at
// us by rl.question(). That is what keeps piped input intact: a question-based
// loop silently drops every line that arrives while no prompt is pending.
const lines = rl[Symbol.asyncIterator]();

// Without an explicit SIGINT handler readline would kill the process outright;
// closing the interface ends the iterator instead, so Ctrl-C unwinds through
// the same path as EOF and we get to say goodbye.
rl.on('SIGINT', () => rl.close());

async function ask(prompt) {
  stdout.write(pc.dim(prompt));
  const { value, done } = await lines.next();
  if (done) throw new EndOfInput();
  return value;
}

function banner() {
  stdout.write(
    [
      '',
      pc.bold(pc.cyan('  KriptoStream DLT Data Feed')),
      pc.dim('  interactive integer calculator'),
      '',
      pc.dim(`  operators: ${OPERATORS.join('  ')}`),
      pc.dim('  press Ctrl-C to exit'),
      '',
      '',
    ].join('\n'),
  );
}

async function evaluateOnce() {
  const a = parseInteger(await ask('first integer   > '));
  const operator = parseOperator(await ask('operator        > '));
  const b = parseInteger(await ask('second integer  > '));

  const result = calculate(a, operator, b);
  stdout.write(`${pc.green('  =')} ${pc.bold(String(result))}\n\n`);
}

async function main() {
  banner();

  for (;;) {
    try {
      await evaluateOnce();
    } catch (error) {
      if (error instanceof ParseError || error instanceof CalculationError) {
        // Bad input is routine, not fatal: report it and prompt again.
        stdout.write(`${pc.yellow('  !')} ${error.message}\n\n`);
        continue;
      }
      if (error instanceof EndOfInput) break;
      throw error;
    }
  }

  stdout.write(`\n${pc.dim('  feed closed - goodbye')}\n`);
  rl.close();
}

main().catch((error) => {
  console.error(pc.red(`fatal: ${error.message}`));
  process.exitCode = 1;
});
