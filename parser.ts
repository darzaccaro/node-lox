import type { Token } from "./tokens";
import { TokenType } from "./tokens";
import { die } from "./die";
import { Environment } from "./runtime";

const environment = new Environment();

type Decl = VarDecl | Stmt;
type Stmt = ExprStmt | PrintStmt;
type Expr = Primary | Unary | Binary | Grouping;
export type LiteralValue = string | number | true | false | null;

class VarDecl {
    keyword = "var";
    name: string;
    operator?: "=";
    initializer?: Expr;
    ending = ";";
    constructor(identifier: string, initializer?: Expr) {
        this.name = identifier;
        if (initializer) {
            this.operator = "=";
            this.initializer = initializer;
        }
    }
    toString = (): string => {
        const decl = `${this.keyword} ${this.name}`;
        const initializer = this.operator ? ` ${this.operator} ${this.initializer}` : "";
        const end = `${this.ending}`;
        return decl + initializer + end;
    };
    evaluate = (): null => {
        let value = null;
        if (this.initializer) {
            value = this.initializer.evaluate();
        }
        environment.define(this.name, value);
        return null;
    };
}

class ExprStmt {
    expression: Expr;
    ending = ";";
    constructor(expression: Expr) {
        this.expression = expression;
    }
    toString = (): string => `${this.expression}${this.ending}`;
    evaluate = (): null => {
        this.expression.evaluate();
        return null;
    };
}

class PrintStmt {
    keyword = "print";
    expression: Expr;
    ending = ";";
    constructor(expression: Expr) {
        this.expression = expression;
    }
    toString = (): string => `${this.keyword}${this.expression}${this.ending}`;
    evaluate = (): null => {
        console.log(this.expression.evaluate());
        return null;
    };
}

class Primary {
    token: Token;
    constructor(token: Token, isIdentifier = false) {
        this.token = token;
    }
    toString = (): string => `${this.token.literal}`;
    evaluate = (): LiteralValue => {
        if (this.token.type === TokenType.IDENTIFIER) {
            return environment.get(this.token);
        } else {
            return this.token.literal;
        }
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
            return !isTruthy(this.right.evaluate());
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
 * program -> declaration* EOF;
 * declaration -> varDecl | statement;
 * varDecl -> "var" IDENTIFIER ("=" expression )? ";";
 * statement -> exprStmt | printStmt;
 * exprStmt -> expression ";";
 * printStmt -> "print" expression ";";
 * expression -> equality;
 * equality -> comparison (( '==' | '!=') comparison)*;
 * comparison -> term (('>' | '>=' | '<' | '<=') term)*;
 * term -> factor (('-' | '+') factor)*;
 * factor -> unary (('/' | '*') unary)*;
 * unary -> ("-" | "!") (unary | primary);
 * primary -> NUMBER | STRING | 'true' | 'false' | 'nil' | '(' expression ')' | IDENTIFIER;
 */

export class Parser {
    tokens: Token[];
    current: number;
    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.current = 0;
    }
    parse = (): Decl[] => {
        const declarations = [];
        while (!this.isAtEnd()) {
            declarations.push(this.declaration());
        }
        return declarations;
    };
    declaration = (): Decl => {
        if (this.match([TokenType.VAR])) {
            return this.varDeclaration();
        }
        return this.statement();
    };
    varDeclaration = (): Decl => {
        const token = this.consume(TokenType.IDENTIFIER);
        let initializer = null;
        if (this.match([TokenType.EQUAL])) {
            initializer = this.expression();
        }
        this.consume(TokenType.SEMICOLON);
        return new VarDecl(token.lexeme, initializer);
    };
    statement = (): Stmt => {
        if (this.match([TokenType.PRINT])) {
            return this.printStmt();
        }
        return this.exprStmt();
    };
    printStmt = (): PrintStmt => {
        const expr: Expr = this.expression();
        this.consume(TokenType.SEMICOLON);
        return new PrintStmt(expr);
    };
    exprStmt = (): ExprStmt => {
        const expr: Expr = this.expression();
        this.consume(TokenType.SEMICOLON);
        return new ExprStmt(expr);
    };
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
        if (this.match([TokenType.TRUE])) return new Primary(this.tokens[this.current - 1]);
        if (this.match([TokenType.FALSE])) return new Primary(this.tokens[this.current - 1]);
        if (this.match([TokenType.NIL])) return new Primary(this.tokens[this.current - 1]);
        if (this.match([TokenType.NUMBER, TokenType.STRING])) return new Primary(this.tokens[this.current - 1]);
        if (this.match([TokenType.OPEN_PAREN])) {
            let expr: Expr = this.expression();
            this.consume(TokenType.CLOSE_PAREN);
            return new Grouping(expr);
        }
        if (this.match([TokenType.IDENTIFIER])) return new Primary(this.tokens[this.current - 1], true);
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
            const token = this.tokens[this.current];
            this.advance();
            return token;
        } else {
            die("parser", `attempt to consume unexpected token\nexpected: ${type}, actual: ${this.tokens[this.current].type}`, this.tokens[this.current].line);
        }
    };
}

function isTruthy(v: LiteralValue) {
    if (typeof v === "boolean") return v;
    die("", "only booleans have truthiness");
}
