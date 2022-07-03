import type { Token } from "./tokens";
import { TokenType } from "./tokens";
import { die } from "./die";

type Expr = Literal | Unary | Binary | Grouping;
type LiteralValue = string | number | true | false | null;

class Literal {
    value: LiteralValue;
    constructor(value: LiteralValue) {
        this.value = value;
    }
    toString = (): string => `${this.value}`;
    evaluate = (): LiteralValue => {
        return this.value;
    };
}

class Unary {
    operator: "!" | "-";
    right: Expr;
    constructor(operator: "!" | "-", right: Expr) {
        this.operator = operator;
        this.right = right;
    }
    toString = (): string => `(${this.operator} ${this.right.toString()})`;
    evaluate = (): LiteralValue => {
        if (this.operator === "-") {
            return -this.right.evaluate();
        } else if (this.operator === "!") {
            return !this.right.evaluate();
        }
    };
}
class Binary {
    left: Expr;
    operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "+" | "-" | "*" | "/";
    right: Expr;
    constructor(left: Expr, operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "+" | "-" | "*" | "/", right: Expr) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
    toString = (): string => `(${this.left.toString()} ${this.operator} ${this.right.toString()})`;
    evaluate = (): LiteralValue => {
        if (this.operator === "==") {
            return this.left.evaluate() === this.right.evaluate();
        } else if (this.operator === "!=") {
            return this.left.evaluate() !== this.right.evaluate();
        } else if (this.operator === "<") {
            return this.left.evaluate() < this.right.evaluate();
        } else if (this.operator === "<=") {
            return this.left.evaluate() <= this.right.evaluate();
        } else if (this.operator === ">") {
            return this.left.evaluate() > this.right.evaluate();
        } else if (this.operator === ">=") {
            return this.left.evaluate() >= this.right.evaluate();
        } else if (this.operator === "+") {
            return (this.left.evaluate() as number) + (this.right.evaluate() as number);
        } else if (this.operator === "-") {
            return (this.left.evaluate() as number) - (this.right.evaluate() as number);
        } else if (this.operator === "*") {
            return (this.left.evaluate() as number) * (this.right.evaluate() as number);
        } else if (this.operator === "/") {
            return (this.left.evaluate() as number) / (this.right.evaluate() as number);
        }
    };
}
class Grouping {
    open = "(";
    expr: Expr;
    close = ")";
    constructor(expr: Expr) {
        this.expr = expr;
    }
    toString = (): string => `(${this.expr.toString()})`;
    evaluate = (): LiteralValue => {
        return this.expr.evaluate();
    };
}

/* BNF grammar:
 * expression -> equality;
 * equality -> comparison (( '==' | '!=') comparison)*;
 * comparison -> term (('>' | '>=' | '<' | '<=') term)*;
 * term -> factor (('-' | '+') factor)*;
 * factor -> unary (('/' | '*') unary)*;
 * unary -> ("-" | "!") (unary | primary);
 * primary -> NUMBER | STRING | 'true' | 'false' | 'nil' | '(' expression ')';
 */

export class Parser {
    tokens: Token[];
    current: number;
    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.current = 0;
    }
    expression = (): Expr => {
        return this.equality();
    };

    equality = (): Expr => {
        let expr: Expr = this.comparison();
        while (this.match([TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL])) {
            // @ts-expect-error
            expr = new Binary(expr, this.tokens[this.current - 1].type, this.comparison());
        }
        return expr;
    };

    comparison = (): Expr => {
        let expr: Expr = this.term();
        while (this.match([TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESSER, TokenType.LESSER_EQUAL])) {
            // @ts-expect-error
            expr = new Binary(expr, this.tokens[this.current - 1].type, this.term());
        }
        return expr;
    };

    term = (): Expr => {
        let expr: Expr = this.factor();
        while (this.match([TokenType.PLUS, TokenType.MINUS])) {
            // @ts-expect-error
            expr = new Binary(expr, this.tokens[this.current - 1].type, this.factor());
        }
        return expr;
    };

    factor = (): Expr => {
        let expr: Expr = this.unary();
        while (this.match([TokenType.FORWARD_SLASH, TokenType.ASTERISK])) {
            // @ts-expect-error
            expr = new Binary(expr, this.tokens[this.current - 1].type, this.unary());
        }
        return expr;
    };

    unary = (): Expr => {
        if (this.match([TokenType.BANG, TokenType.MINUS])) {
            // @ts-expect-error
            return new Unary(this.tokens[this.current - 1].type, this.unary());
        }
        return this.primary();
    };

    primary = (): Expr => {
        if (this.match([TokenType.TRUE])) return new Literal(true);
        if (this.match([TokenType.FALSE])) return new Literal(false);
        if (this.match([TokenType.NIL])) return new Literal(null);
        if (this.match([TokenType.NUMBER, TokenType.STRING])) return new Literal(this.tokens[this.current - 1].literal);
        if (this.match([TokenType.OPEN_PAREN])) {
            let expr: Expr = this.expression();
            this.consume(TokenType.CLOSE_PAREN);
            return new Grouping(expr);
        }
        die("parser", "expected expression", this.tokens[this.current].line);
    };

    match = (types: Exclude<TokenType, TokenType.EOF>[]): boolean => {
        if (this.isAtEnd()) return false;
        for (const type of types) {
            if (this.tokens[this.current].type === type) {
                this.advance();
                return true;
            }
        }
        return false;
    };

    isAtEnd = (): boolean => {
        return this.tokens[this.current].type === TokenType.EOF;
    };

    advance = () => {
        if (!this.isAtEnd()) this.current++;
    };

    consume = (type: Exclude<TokenType, TokenType.EOF>) => {
        if (this.tokens[this.current].type === type) {
            this.advance();
        } else {
            die("parser", `attempt to consume unexpected token\nexpected: ${type}, actual: ${this.tokens[this.current].type}`, this.tokens[this.current].line);
        }
    };
}
