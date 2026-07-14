import {
  addDecimals,
  createDecimal,
  divideDecimals,
  multiplyDecimals,
  negateDecimal,
  subtractDecimals,
} from '../decimal';
import type { DecimalValue } from '../decimal';

export type ArithmeticOperator = '+' | '-' | '*' | '/';
export type UnaryOperator = '+' | '-';

export type ExpressionNode = NumberNode | UnaryExpressionNode | BinaryExpressionNode;

export interface NumberNode {
  type: 'number';
  value: DecimalValue;
  raw: string;
}

export interface UnaryExpressionNode {
  type: 'unary';
  operator: UnaryOperator;
  argument: ExpressionNode;
}

export interface BinaryExpressionNode {
  type: 'binary';
  operator: ArithmeticOperator;
  left: ExpressionNode;
  right: ExpressionNode;
}

export type ExpressionErrorCode =
  | 'empty-expression'
  | 'decimal-error'
  | 'invalid-number'
  | 'invalid-token'
  | 'unexpected-token'
  | 'unclosed-parenthesis'
  | 'divide-by-zero'
  | 'non-finite-result';

export interface ExpressionError {
  code: ExpressionErrorCode;
  message: string;
  position: number;
}

export type ParseExpressionResult =
  | {
      ok: true;
      ast: ExpressionNode;
    }
  | {
      ok: false;
      error: ExpressionError;
    };

export type EvaluationResult =
  | {
      ok: true;
      value: DecimalValue;
      ast: ExpressionNode;
    }
  | {
      ok: false;
      error: ExpressionError;
    };

type Token = NumberToken | OperatorToken | LeftParenToken | RightParenToken | EndToken;

interface NumberToken {
  type: 'number';
  value: DecimalValue;
  raw: string;
  position: number;
}

interface OperatorToken {
  type: 'operator';
  value: ArithmeticOperator;
  position: number;
}

interface LeftParenToken {
  type: 'left-paren';
  position: number;
}

interface RightParenToken {
  type: 'right-paren';
  position: number;
}

interface EndToken {
  type: 'end';
  position: number;
}

type TokenizeResult =
  | {
      ok: true;
      tokens: Token[];
    }
  | {
      ok: false;
      error: ExpressionError;
    };

export function parseExpression(expression: string): ParseExpressionResult {
  const tokenized = tokenizeExpression(expression);

  if (!tokenized.ok) {
    return tokenized;
  }

  const parser = new ExpressionParser(tokenized.tokens);
  return parser.parse();
}

export function evaluateExpression(expression: string): EvaluationResult {
  const parsed = parseExpression(expression);

  if (!parsed.ok) {
    return parsed;
  }

  const evaluated = evaluateNode(parsed.ast);

  if (!evaluated.ok) {
    return evaluated;
  }

  return {
    ok: true,
    value: evaluated.value,
    ast: parsed.ast,
  };
}

export function evaluateParsedExpression(ast: ExpressionNode): EvaluationResult {
  const evaluated = evaluateNode(ast);

  if (!evaluated.ok) {
    return evaluated;
  }

  return {
    ok: true,
    value: evaluated.value,
    ast,
  };
}

export function tokenizeExpression(expression: string): TokenizeResult {
  const tokens: Token[] = [];
  let position = 0;

  while (position < expression.length) {
    const character = expression[position];

    if (isWhitespace(character)) {
      position += 1;
      continue;
    }

    if (isNumberStart(expression, position)) {
      const tokenizedNumber = readNumber(expression, position);

      if (!tokenizedNumber.ok) {
        return tokenizedNumber;
      }

      tokens.push(tokenizedNumber.token);
      position = tokenizedNumber.nextPosition;
      continue;
    }

    const operator = normalizeOperator(character);

    if (operator) {
      tokens.push({
        type: 'operator',
        value: operator,
        position,
      });
      position += 1;
      continue;
    }

    if (character === '(') {
      tokens.push({ type: 'left-paren', position });
      position += 1;
      continue;
    }

    if (character === ')') {
      tokens.push({ type: 'right-paren', position });
      position += 1;
      continue;
    }

    return {
      ok: false,
      error: createError('invalid-token', `Unexpected character "${character}".`, position),
    };
  }

  tokens.push({ type: 'end', position });

  return {
    ok: true,
    tokens,
  };
}

class ExpressionParser {
  private cursor = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): ParseExpressionResult {
    if (this.current().type === 'end') {
      return {
        ok: false,
        error: createError(
          'empty-expression',
          'Expression cannot be empty.',
          this.current().position,
        ),
      };
    }

    const expression = this.parseAdditive();

    if (!expression.ok) {
      return expression;
    }

    const nextToken = this.current();

    if (nextToken.type !== 'end') {
      return {
        ok: false,
        error: createError(
          'unexpected-token',
          `Unexpected token "${formatToken(nextToken)}".`,
          nextToken.position,
        ),
      };
    }

    return expression;
  }

  private parseAdditive(): ParseExpressionResult {
    let left = this.parseMultiplicative();

    if (!left.ok) {
      return left;
    }

    while (true) {
      const operator = this.currentOperator();

      if (!operator || (operator.value !== '+' && operator.value !== '-')) {
        break;
      }

      this.advance();
      const right = this.parseMultiplicative();

      if (!right.ok) {
        return right;
      }

      left = {
        ok: true,
        ast: {
          type: 'binary',
          operator: operator.value,
          left: left.ast,
          right: right.ast,
        },
      };
    }

    return left;
  }

  private parseMultiplicative(): ParseExpressionResult {
    let left = this.parseUnary();

    if (!left.ok) {
      return left;
    }

    while (true) {
      const operator = this.currentOperator();

      if (!operator || (operator.value !== '*' && operator.value !== '/')) {
        break;
      }

      this.advance();
      const right = this.parseUnary();

      if (!right.ok) {
        return right;
      }

      left = {
        ok: true,
        ast: {
          type: 'binary',
          operator: operator.value,
          left: left.ast,
          right: right.ast,
        },
      };
    }

    return left;
  }

  private parseUnary(): ParseExpressionResult {
    const operator = this.currentOperator();

    if (operator && (operator.value === '+' || operator.value === '-')) {
      this.advance();
      const argument = this.parseUnary();

      if (!argument.ok) {
        return argument;
      }

      return {
        ok: true,
        ast: {
          type: 'unary',
          operator: operator.value,
          argument: argument.ast,
        },
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ParseExpressionResult {
    const token = this.current();

    if (token.type === 'number') {
      this.advance();
      return {
        ok: true,
        ast: {
          type: 'number',
          value: token.value,
          raw: token.raw,
        },
      };
    }

    if (token.type === 'left-paren') {
      this.advance();
      const expression = this.parseAdditive();

      if (!expression.ok) {
        return expression;
      }

      if (this.current().type !== 'right-paren') {
        return {
          ok: false,
          error: createError(
            'unclosed-parenthesis',
            'Expected a closing parenthesis.',
            this.current().position,
          ),
        };
      }

      this.advance();
      return expression;
    }

    return {
      ok: false,
      error: createError(
        'unexpected-token',
        `Expected a number or parenthesized expression, received "${formatToken(token)}".`,
        token.position,
      ),
    };
  }

  private currentOperator(): OperatorToken | null {
    const token = this.current();
    return token.type === 'operator' ? token : null;
  }

  private current(): Token {
    return this.tokens[this.cursor] ?? this.tokens[this.tokens.length - 1];
  }

  private advance(): void {
    if (this.cursor < this.tokens.length - 1) {
      this.cursor += 1;
    }
  }
}

type NodeEvaluationResult =
  | {
      ok: true;
      value: DecimalValue;
    }
  | {
      ok: false;
      error: ExpressionError;
    };

function evaluateNode(node: ExpressionNode): NodeEvaluationResult {
  if (node.type === 'number') {
    return {
      ok: true,
      value: node.value,
    };
  }

  if (node.type === 'unary') {
    const value = evaluateNode(node.argument);

    if (!value.ok) {
      return value;
    }

    return node.operator === '-' ? decimalToEvaluationResult(negateDecimal(value.value), 0) : value;
  }

  const left = evaluateNode(node.left);

  if (!left.ok) {
    return left;
  }

  const right = evaluateNode(node.right);

  if (!right.ok) {
    return right;
  }

  return decimalToEvaluationResult(applyOperator(node.operator, left.value, right.value), 0);
}

function applyOperator(
  operator: ArithmeticOperator,
  left: DecimalValue,
  right: DecimalValue,
): ReturnType<typeof addDecimals> {
  switch (operator) {
    case '+':
      return addDecimals(left, right);
    case '-':
      return subtractDecimals(left, right);
    case '*':
      return multiplyDecimals(left, right);
    case '/':
      return divideDecimals(left, right);
  }
}

function decimalToEvaluationResult(
  decimalResult: ReturnType<typeof addDecimals>,
  position: number,
): NodeEvaluationResult {
  if (decimalResult.ok) {
    return {
      ok: true,
      value: decimalResult.value,
    };
  }

  if (decimalResult.error.code === 'divide-by-zero') {
    return {
      ok: false,
      error: createError('divide-by-zero', decimalResult.error.message, position),
    };
  }

  if (decimalResult.error.code === 'non-finite-result') {
    return {
      ok: false,
      error: createError('non-finite-result', decimalResult.error.message, position),
    };
  }

  return {
    ok: false,
    error: createError('decimal-error', decimalResult.error.message, position),
  };
}

function readNumber(
  expression: string,
  startPosition: number,
):
  | {
      ok: true;
      token: NumberToken;
      nextPosition: number;
    }
  | {
      ok: false;
      error: ExpressionError;
    } {
  let position = startPosition;
  let hasDecimalPoint = false;
  let hasDigit = false;

  while (position < expression.length) {
    const character = expression[position];

    if (isDigit(character)) {
      hasDigit = true;
      position += 1;
      continue;
    }

    if (character === '.' && !hasDecimalPoint) {
      hasDecimalPoint = true;
      position += 1;
      continue;
    }

    break;
  }

  if (!hasDigit) {
    return {
      ok: false,
      error: createError(
        'invalid-number',
        'Number must contain at least one digit.',
        startPosition,
      ),
    };
  }

  if (isExponentMarker(expression[position])) {
    const exponentStart = position;
    position += 1;

    if (expression[position] === '+' || expression[position] === '-') {
      position += 1;
    }

    const exponentDigitsStart = position;

    while (position < expression.length && isDigit(expression[position])) {
      position += 1;
    }

    if (position === exponentDigitsStart) {
      return {
        ok: false,
        error: createError(
          'invalid-number',
          'Exponent must contain at least one digit.',
          exponentStart,
        ),
      };
    }
  }

  const raw = expression.slice(startPosition, position);
  const decimal = createDecimal(raw);

  if (!decimal.ok) {
    return {
      ok: false,
      error: createError('invalid-number', decimal.error.message, startPosition),
    };
  }

  return {
    ok: true,
    token: {
      type: 'number',
      value: decimal.value,
      raw,
      position: startPosition,
    },
    nextPosition: position,
  };
}

function isNumberStart(expression: string, position: number): boolean {
  const character = expression[position];
  return isDigit(character) || (character === '.' && isDigit(expression[position + 1]));
}

function normalizeOperator(character: string): ArithmeticOperator | null {
  if (character === '+' || character === '-' || character === '/') {
    return character;
  }

  if (character === '*' || character === 'x' || character === 'X' || character === '×') {
    return '*';
  }

  if (character === '÷') {
    return '/';
  }

  return null;
}

function isWhitespace(character: string): boolean {
  return /\s/.test(character);
}

function isDigit(character: string | undefined): boolean {
  return character !== undefined && character >= '0' && character <= '9';
}

function isExponentMarker(character: string | undefined): boolean {
  return character === 'e' || character === 'E';
}

function formatToken(token: Token): string {
  switch (token.type) {
    case 'number':
      return token.raw;
    case 'operator':
      return token.value;
    case 'left-paren':
      return '(';
    case 'right-paren':
      return ')';
    case 'end':
      return 'end of expression';
  }
}

function createError(
  code: ExpressionErrorCode,
  message: string,
  position: number,
): ExpressionError {
  return {
    code,
    message,
    position,
  };
}
