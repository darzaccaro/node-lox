import * as fs from "fs";
import * as readline from "readline";

const args = process.argv.slice(2);

console.log("args", args);
if (args.length > 1) {
    console.error("Usage: nodelox [script]");
    process.exit(64);
} else if (args.length === 1 && args[0]) {
    runFile(args[0]);
} else {
    void runPrompt();
}

function runFile(path: string) {
    run(fs.readFileSync(path, { encoding: "utf-8" }));
}

async function runPrompt() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    let isRunning = true;
    while (isRunning) {
        isRunning = await new Promise((resolve) =>
            rl.question("> ", (line: string) => {
                if (!line) return resolve(false);
                run(line);
                return resolve(true);
            })
        );
    }
    rl.close();
}

function run(source: string) {
    const tokens = scanTokens(source);
    console.log(tokens);
}

function report(line: number, location: string, message: string) {
    console.error(`[line ${line}] Error ${location}: ${message}`);
}

const enum TokenType {
    // 1 char
    OPEN_PAREN = "(",
    CLOSE_PAREN = ")",
    OPEN_CURLY = "{",
    CLOSE_CURLY = "}",
    COMMA = ",",
    DOT = ".",
    MINUS = "-",
    PLUS = "+",
    SEMICOLON = ";",
    FORWARD_SLASH = "/",
    DOUBLE_FORWARD_SLASH = "//",
    ASTERISK = "*",
    // 1 or 2 char
    BANG = "!",
    BANG_EQUAL = "!=",
    EQUAL = "=",
    EQUAL_EQUAL = "==",
    GREATER = ">",
    GREATER_EQUAL = ">=",
    LESSER = "<",
    LESSER_EQUAL = "<=",
    // keyword
    AND = "and",
    CLASS = "class",
    ELSE = "else",
    FALSE = "false",
    FUN = "fun",
    FOR = "for",
    IF = "if",
    NIL = "nil",
    OR = "or",
    PRINT = "print",
    RETURN = "return",
    SUPER = "super",
    THIS = "this",
    TRUE = "true",
    VAR = "var",
    WHILE = "while",
    // literal
    IDENTIFIER = "identifier",
    STRING = "string",
    NUMBER = "number",
    // special
    EOF = "EOF",
}

interface Token {
    type: TokenType;
    lexeme?: string;
    literal?: any;
    line: number;
}

function scanTokens(source: string) {
    const tokens: Token[] = [];
    let line = 1;
    for (let i = 0; i < source.length; ) {
        let length = 1;
        switch (source[i]) {
            case "(":
                tokens.push({ type: TokenType.OPEN_PAREN, line });
                break;
            case ")":
                tokens.push({ type: TokenType.CLOSE_PAREN, line });
                break;
            case "{":
                tokens.push({ type: TokenType.OPEN_CURLY, line });
                break;
            case "}":
                tokens.push({ type: TokenType.CLOSE_CURLY, line });
                break;
            case ",":
                tokens.push({ type: TokenType.COMMA, line });
                break;
            case ".":
                tokens.push({ type: TokenType.DOT, line });
                break;
            case "+":
                tokens.push({ type: TokenType.PLUS, line });
                break;
            case "-":
                tokens.push({ type: TokenType.MINUS, line });
                break;
            case ";":
                tokens.push({ type: TokenType.SEMICOLON, line });
                break;
            case "*":
                tokens.push({ type: TokenType.ASTERISK, line });
                break;
            case "!":
                if (source[i + 1] === "=") {
                    tokens.push({ type: TokenType.BANG_EQUAL, line });
                    length++;
                } else {
                    tokens.push({ type: TokenType.BANG, line });
                }
                break;
            case "=":
                if (source[i + 1] === "=") {
                    tokens.push({ type: TokenType.EQUAL_EQUAL, line });
                    length++;
                } else {
                    tokens.push({ type: TokenType.EQUAL, line });
                }
                break;
            case ">":
                if (source[i + 1] === "=") {
                    tokens.push({ type: TokenType.GREATER_EQUAL, line });
                    length++;
                } else {
                    tokens.push({ type: TokenType.GREATER, line });
                }
                break;
            case "<":
                if (source[i + 1] === "=") {
                    tokens.push({ type: TokenType.LESSER_EQUAL, line });
                    length++;
                } else {
                    tokens.push({ type: TokenType.LESSER, line });
                }
                break;
            case "/":
                if (source[i + 1] === "/") {
                    for (let ii = i + 1; source[ii] != "\n"; ii++) {
                        length++;
                    }
                    length++;
                    line++;
                } else {
                    tokens.push({ type: TokenType.FORWARD_SLASH, line });
                }
                break;
            case " ":
            case "\r":
            case "\t":
                break;
            case "\n":
                line++;
                break;
            case '"':
                const lineStart = line;
                for (let ii = i + 1; source[ii] != '"'; ii++) {
                    if (ii > source.length) {
                        report(line, "", "unterminated string");
                        process.exit(65);
                    }
                    if (source[ii] === "\n") line++;
                    length++;
                }
                tokens.push({ type: TokenType.STRING, line: lineStart, literal: source.slice(i + 1, i + length) });
                length++;
                break;
            default:
                report(line, "", "failed to scan token");
                process.exit(65);
        }
        i += length;
    }
    tokens.push({ type: TokenType.EOF, line });
    return tokens;
}
