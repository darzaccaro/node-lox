import type { Token } from "./tokens";
import { TokenType } from "./tokens";
import { die } from "./die";
import { Environment } from "./runtime";

const environment = new Environment();

type Decl = VarDecl | Stmt;
type Stmt = ExprStmt | PrintStmt;
type Expr = Literal | Variable | Unary | Binary | Grouping | Assignment;
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

class Assignment {
    lvalue: Token;
    operator = "=";
    rvalue: Expr;
    constructor(identifier: Token, value: Expr) {
        this.lvalue = identifier;
        this.rvalue = value;
    }
    toString = (): string => `${this.lvalue.toString} ${this.operator} ${this.rvalue.toString()}`;
    evaluate = (): null => {
        environment.set(this.lvalue, this.rvalue.evaluate());
        return null;
    };
}

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

class Variable {
    identifier: Token;
    constructor(token: Token) {
        this.identifier = token;
    }
    toString = (): string => `${this.identifier.lexeme}`;
    evaluate = (): LiteralValue => {
        return environment.get(this.identifier);
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
 * program -> declaration* EOF ";"
 * declaration -> varDecl | statement ";"
 * varDecl -> "var" IDENTIFIER ("=" expression )? ";";
 * statement -> assignStmt | printStmt | exprStmt ";"
 * exprStmt -> expression ";";
 * printStmt -> "print" expression ";";
 * expression -> assignment ";"
 * assignment -> IDENTIFIER "=" assignment | equality ";"
 * equality -> comparison (( '==' | '!=') comparison)* ";"
 * comparison -> term (('>' | '>=' | '<' | '<=') term)* ";"
 * term -> factor (('-' | '+') factor)* ";"
 * factor -> unary (('/' | '*') unary)* ";"
 * unary -> ("-" | "!") (unary | primary) ";"
 * primary -> NUMBER | STRING | 'true' | 'false' | 'nil' | '(' expression ')' | IDENTIFIER ";"
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
        if (this.matchAny([TokenType.VAR])) {
            return this.varDeclaration();
        }
        return this.statement();
    };
    varDeclaration = (): Decl => {
        const token = this.consume(TokenType.IDENTIFIER);
        let initializer = null;
        if (this.matchAny([TokenType.EQUAL])) {
            initializer = this.expression();
        }
        this.consume(TokenType.SEMICOLON);
        return new VarDecl(token.lexeme, initializer);
    };
    statement = (): Stmt => {
        if (this.matchAny([TokenType.PRINT])) {
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
        return this.assignment();
    };
    assignment = (): Expr => {
        let expr: Expr = this.equality();
        if (this.matchAny([TokenType.EQUAL])) {
            let operator: Token = this.previousToken();
            let value: Expr = this.assignment();
            if (expr instanceof Variable) {
                let identifier: Token = expr.identifier;
                return new Assignment(identifier, value);
            }
            die("parser", "invalid assignment target", operator.line);
        }
        return expr;
    };
    equality = (): Expr => {
        let expr: Expr = this.comparison();
        while (this.matchAny([TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL])) {
            // @ts-expect-error
            expr = new Binary(expr, this.previousToken().type, this.comparison());
        }
        return expr;
    };

    comparison = (): Expr => {
        let expr: Expr = this.term();
        while (this.matchAny([TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESSER, TokenType.LESSER_EQUAL])) {
            // @ts-expect-error
            expr = new Binary(expr, this.previousToken().type, this.term());
        }
        return expr;
    };

    term = (): Expr => {
        let expr: Expr = this.factor();
        while (this.matchAny([TokenType.PLUS, TokenType.MINUS])) {
            // @ts-expect-error
            expr = new Binary(expr, this.previousToken().type, this.factor());
        }
        return expr;
    };

    factor = (): Expr => {
        let expr: Expr = this.unary();
        while (this.matchAny([TokenType.FORWARD_SLASH, TokenType.ASTERISK])) {
            // @ts-expect-error
            expr = new Binary(expr, this.previousToken().type, this.unary());
        }
        return expr;
    };

    unary = (): Expr => {
        if (this.matchAny([TokenType.BANG, TokenType.MINUS])) {
            // @ts-expect-error
            return new Unary(this.previousToken().type, this.unary());
        }
        return this.primary();
    };

    primary = (): Expr => {
        if (this.matchAny([TokenType.TRUE])) return new Literal(true);
        if (this.matchAny([TokenType.FALSE])) return new Literal(false);
        if (this.matchAny([TokenType.NIL])) return new Literal(null);
        if (this.matchAny([TokenType.NUMBER, TokenType.STRING])) return new Literal(this.previousToken().literal);
        if (this.matchAny([TokenType.OPEN_PAREN])) {
            let expr: Expr = this.expression();
            this.consume(TokenType.CLOSE_PAREN);
            return new Grouping(expr);
        }
        if (this.matchAny([TokenType.IDENTIFIER])) return new Variable(this.previousToken());
        die("parser", "expected expression", this.currentToken().line);
    };

    matchAny = (types: Exclude<TokenType, TokenType.EOF>[]): boolean => {
        if (this.isAtEnd()) return false;
        for (const type of types) {
            if (this.currentToken().type === type) {
                this.advance();
                return true;
            }
        }
        return false;
    };

    matchSeries = (types: Exclude<TokenType, TokenType.EOF>[]): boolean => {
        for (let i = 0; i < types.length; i++) {
            if (this.isAtEnd()) return false;
            if (this.currentToken().type === types[i]) {
                this.advance();
                continue;
            }
            this.current -= i;
            return false;
        }
        return true;
    };

    isAtEnd = (): boolean => {
        return this.currentToken().type === TokenType.EOF;
    };

    advance = () => {
        if (!this.isAtEnd()) this.current++;
    };

    consume = (type: Exclude<TokenType, TokenType.EOF>) => {
        if (this.currentToken().type === type) {
            const token = this.currentToken();
            this.advance();
            return token;
        } else {
            die("parser", `attempt to consume unexpected token\nexpected: ${type}, actual: ${this.tokens[this.current].type}`, this.tokens[this.current].line);
        }
    };
    previousToken = () => this.tokens[this.current - 1];
    currentToken = () => this.tokens[this.current];
}

function isTruthy(v: LiteralValue) {
    if (typeof v === "boolean") return v;
    die("", "only booleans have truthiness");
}
