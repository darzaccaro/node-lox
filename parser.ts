import type { Token } from "./tokens";
import { TokenType } from "./tokens";
import { die } from "./die";
import { Environment } from "./environment";

export type Decl = VarDecl | Stmt;
type Stmt = ExprStmt | IfStmt | PrintStmt | WhileStmt | BlockStmt;
type Expr = Literal | Variable | Unary | Binary | Grouping | Assignment | Logical;
export type LiteralValue = string | number | true | false | null;

export class VarDecl {
    name: string;
    initializer?: Expr;
    constructor(identifier: string, initializer?: Expr) {
        this.name = identifier;
        this.initializer = initializer;
    }
    toString = (): string => `var ${this.name}${this.initializer ? ` = ${this.initializer.toString()}` : ""};`;
    evaluate = (environment: Environment): null => {
        let value = null;
        if (this.initializer) {
            value = this.initializer.evaluate(environment);
        }
        environment.define(this.name, value);
        return null;
    };
}

export class IfStmt {
    conditional: Expr;
    statement: Stmt;
    else?: Stmt;

    constructor(conditional: Expr, statement: Stmt, elseStmt?: Stmt) {
        this.conditional = conditional;
        this.statement = statement;
        this.else = elseStmt;
    }

    toString = (): string => `if (${this.conditional.toString()}) ${this.statement.toString()} ${this.else ? this.else.toString() : ""}`;
    evaluate = (environment: Environment): null => {
        if (isTruthy(this.conditional.evaluate(environment))) {
            this.statement.evaluate(environment);
        } else {
            if (this.else) {
                this.else.evaluate(environment);
            }
        }
        return null;
    };
}

export class BlockStmt {
    statements: Decl[];
    constructor(statements: Decl[]) {
        this.statements = statements;
    }
    toString = (): string => `{\n${this.statements.map((s) => "\t" + s.toString())}\n}`;
    evaluate = (environment: Environment): null => {
        this.statements.forEach((s) => s.evaluate(environment));
        return null;
    };
}

class ExprStmt {
    expression: Expr;
    constructor(expression: Expr) {
        this.expression = expression;
    }
    toString = (): string => `${this.expression};`;
    evaluate = (environment: Environment): null => {
        this.expression.evaluate(environment);
        return null;
    };
}

class PrintStmt {
    expression: Expr;
    constructor(expression: Expr) {
        this.expression = expression;
    }
    toString = (): string => `print ${this.expression};`;
    evaluate = (environment: Environment): null => {
        console.log(this.expression.evaluate(environment));
        return null;
    };
}

class WhileStmt {
    expression: Expr;
    statement: Stmt;
    constructor(expression: Expr, statement: Stmt) {
        this.expression = expression;
        this.statement = statement;
    }
    toString = (): string => `while (${this.expression.toString()}) ${this.statement.toString()}`;
    evaluate = (environment: Environment): null => {
        while (isTruthy(this.expression.evaluate(environment))) {
            this.statement.evaluate(environment);
        }
        return null;
    };
}

export class Assignment {
    lvalue: Token;
    rvalue: Expr;
    constructor(identifier: Token, value: Expr) {
        this.lvalue = identifier;
        this.rvalue = value;
    }
    toString = (): string => `${this.lvalue.toString} = ${this.rvalue.toString()}`;
    evaluate = (environment: Environment): null => {
        environment.set(this.lvalue, this.rvalue.evaluate(environment));
        return null;
    };
}

class Literal {
    value: LiteralValue;
    constructor(value: LiteralValue) {
        this.value = value;
    }
    toString = (): string => `${this.value}`;
    evaluate = (environment: Environment): LiteralValue => {
        return this.value;
    };
}

class Variable {
    identifier: Token;
    constructor(token: Token) {
        this.identifier = token;
    }
    toString = (): string => `${this.identifier.lexeme}`;
    evaluate = (environment: Environment): LiteralValue => {
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
    evaluate = (environment: Environment): LiteralValue => {
        if (this.operator === "-") {
            return -this.right.evaluate(environment);
        } else if (this.operator === "!") {
            return !isTruthy(this.right.evaluate(environment));
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
    evaluate = (environment: Environment): LiteralValue => {
        if (this.operator === "==") {
            return this.left.evaluate(environment) === this.right.evaluate(environment);
        } else if (this.operator === "!=") {
            return this.left.evaluate(environment) !== this.right.evaluate(environment);
        } else if (this.operator === "<") {
            return this.left.evaluate(environment) < this.right.evaluate(environment);
        } else if (this.operator === "<=") {
            return this.left.evaluate(environment) <= this.right.evaluate(environment);
        } else if (this.operator === ">") {
            return this.left.evaluate(environment) > this.right.evaluate(environment);
        } else if (this.operator === ">=") {
            return this.left.evaluate(environment) >= this.right.evaluate(environment);
        } else if (this.operator === "+") {
            return (this.left.evaluate(environment) as number) + (this.right.evaluate(environment) as number);
        } else if (this.operator === "-") {
            return (this.left.evaluate(environment) as number) - (this.right.evaluate(environment) as number);
        } else if (this.operator === "*") {
            return (this.left.evaluate(environment) as number) * (this.right.evaluate(environment) as number);
        } else if (this.operator === "/") {
            return (this.left.evaluate(environment) as number) / (this.right.evaluate(environment) as number);
        }
    };
}
class Grouping {
    expr: Expr;
    constructor(expr: Expr) {
        this.expr = expr;
    }
    toString = (): string => `(${this.expr.toString()})`;
    evaluate = (environment: Environment): LiteralValue => {
        return this.expr.evaluate(environment);
    };
}
class Logical {
    left: Expr;
    operator: "and" | "or";
    right: Expr;
    constructor(left: Expr, operator: "and" | "or", right: Expr) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
    toString = (): string => `${this.left.toString()} ${this.operator} ${this.right.toString()}`;
    evaluate = (environment: Environment): LiteralValue => {
        const left = this.left.evaluate(environment);
        if (this.operator === "or" && isTruthy(left)) return left;
        if (this.operator === "and" && !isTruthy(left)) return left;
        return this.right.evaluate(environment);
    };
}

/* BNF grammar:
 * program -> declaration* EOF ;
 * declaration -> varDecl | statement ;
 * varDecl -> "var" IDENTIFIER ("=" expression )? ;
 * statement -> exprStmt | ifStmt | printStmt | whileStmt | block ;
 * exprStmt -> expression ;
 * ifStmt -> "if" "(" expression ")" statement ("else" statement)? ;
 * printStmt -> "print" expression ;
 * whileStmt -> "while" "(" expression ")" statement ;
 * block -> "{" declaration* "}" ;
 * expression -> assignment ;
 * assignment -> IDENTIFIER "=" assignment | logic_or ;
 * logic_or -> logic_and ("or" logic_and)* ;
 * logic_and -> equality ("and" equality)* ;
 * equality -> comparison (( '==' | '!=') comparison)* ;
 * comparison -> term (('>' | '>=' | '<' | '<=') term)* ;
 * term -> factor (('-' | '+') factor)* ;
 * factor -> unary (('/' | '*') unary)* ;
 * unary -> ("-" | "!") (unary | primary) ;
 * primary -> NUMBER | STRING | 'true' | 'false' | 'nil' | '(' expression ')' | IDENTIFIER ;
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
        if (this.match([TokenType.WHILE])) {
            return this.whileStmt();
        }
        if (this.match([TokenType.IF])) {
            return this.ifStmt();
        }
        if (this.match([TokenType.OPEN_CURLY])) {
            return this.blockStmt();
        }
        if (this.match([TokenType.PRINT])) {
            return this.printStmt();
        }
        return this.exprStmt();
    };
    ifStmt = (): IfStmt => {
        this.consume(TokenType.OPEN_PAREN);
        const cond = this.expression();
        this.consume(TokenType.CLOSE_PAREN);
        const then = this.statement();
        let elseStmt: Stmt = null;
        if (this.match([TokenType.ELSE])) {
            elseStmt = this.statement();
        }
        return new IfStmt(cond, then, elseStmt);
    };
    blockStmt = (): BlockStmt => {
        const statements: Decl[] = [];
        while (!this.check(TokenType.CLOSE_CURLY) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(TokenType.CLOSE_CURLY);
        return new BlockStmt(statements);
    };
    whileStmt = (): WhileStmt => {
        this.consume(TokenType.OPEN_PAREN);
        const condition: Expr = this.expression();
        this.consume(TokenType.CLOSE_PAREN);
        const body: Stmt = this.statement();
        return new WhileStmt(condition, body);
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
        let expr: Expr = this.logicOr();
        if (this.match([TokenType.EQUAL])) {
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
    logicOr = (): Expr => {
        let expr: Expr = this.logicAnd();
        if (this.match([TokenType.OR])) {
            let right: Expr = this.logicOr();
            return new Logical(expr, "or", right);
        }
        return expr;
    };
    logicAnd = (): Expr => {
        let expr: Expr = this.equality();
        if (this.match([TokenType.AND])) {
            let right: Expr = this.logicAnd();
            return new Logical(expr, "and", right);
        }
        return expr;
    };
    equality = (): Expr => {
        let expr: Expr = this.comparison();
        while (this.match([TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL])) {
            // @ts-expect-error
            expr = new Binary(expr, this.previousToken().type, this.comparison());
        }
        return expr;
    };

    comparison = (): Expr => {
        let expr: Expr = this.term();
        while (this.match([TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESSER, TokenType.LESSER_EQUAL])) {
            // @ts-expect-error
            expr = new Binary(expr, this.previousToken().type, this.term());
        }
        return expr;
    };

    term = (): Expr => {
        let expr: Expr = this.factor();
        while (this.match([TokenType.PLUS, TokenType.MINUS])) {
            // @ts-expect-error
            expr = new Binary(expr, this.previousToken().type, this.factor());
        }
        return expr;
    };

    factor = (): Expr => {
        let expr: Expr = this.unary();
        while (this.match([TokenType.FORWARD_SLASH, TokenType.ASTERISK])) {
            // @ts-expect-error
            expr = new Binary(expr, this.previousToken().type, this.unary());
        }
        return expr;
    };

    unary = (): Expr => {
        if (this.match([TokenType.BANG, TokenType.MINUS])) {
            // @ts-expect-error
            return new Unary(this.previousToken().type, this.unary());
        }
        return this.primary();
    };

    primary = (): Expr => {
        if (this.match([TokenType.TRUE])) return new Literal(true);
        if (this.match([TokenType.FALSE])) return new Literal(false);
        if (this.match([TokenType.NIL])) return new Literal(null);
        if (this.match([TokenType.NUMBER, TokenType.STRING])) return new Literal(this.previousToken().literal);
        if (this.match([TokenType.OPEN_PAREN])) {
            let expr: Expr = this.expression();
            this.consume(TokenType.CLOSE_PAREN);
            return new Grouping(expr);
        }
        if (this.match([TokenType.IDENTIFIER])) return new Variable(this.previousToken());
        die("parser", "expected expression", this.currentToken().line);
    };

    check = (type: TokenType): boolean => {
        return this.currentToken().type === type;
    };
    match = (types: Exclude<TokenType, TokenType.EOF>[]): boolean => {
        if (this.isAtEnd()) return false;
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
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
    return v !== null;
}
