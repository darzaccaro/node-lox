import { isAlpha, isAlphaNumeric, isDigit, isDigitOrDot, Token, TokenType } from "./tokens";
import { die } from "./die";

export function scan(source: string): Token[] {
    const keywords: { [key: string]: string } = {
        AND: "and",
        CLASS: "class",
        ELSE: "else",
        FALSE: "false",
        FUN: "fun",
        FOR: "for",
        IF: "if",
        NIL: "nil",
        OR: "or",
        PRINT: "print",
        RETURN: "return",
        SUPER: "super",
        THIS: "this",
        TRUE: "true",
        VAR: "var",
        WHILE: "while",
    };
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
                        die("scanner", "unterminated string", line);
                        process.exit(65);
                    }
                    if (source[ii] === "\n") line++;
                    length++;
                }
                tokens.push({ type: TokenType.STRING, line: lineStart, literal: source.slice(i + 1, i + length) });
                length++;
                break;
            default:
                if (isDigit(source[i])) {
                    let ii = i;
                    for (; isDigitOrDot(source[ii]); ii++) {}
                    const literal = source.slice(i, ii);
                    tokens.push({ type: TokenType.NUMBER, line, literal: Number(literal) });
                    length = literal.length;
                } else if (isAlpha(source[i])) {
                    let ii = i;
                    for (; isAlphaNumeric(source[ii]); ii++) {}
                    const literal = source.slice(i, ii);
                    length = literal.length;
                    if (keywords[literal.toUpperCase()]) {
                        tokens.push({ type: keywords[literal.toUpperCase()] as TokenType, line });
                    } else {
                        die("scanner", "failed to scan token", line);
                        process.exit(65);
                    }
                } else {
                    die("scanner", "failed to scan token", line);
                    process.exit(65);
                }
        }
        i += length;
    }
    tokens.push({ type: TokenType.EOF, line });
    return tokens;
}
