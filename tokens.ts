export const enum TokenType {
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

export interface Token {
    type: TokenType;
    lexeme?: string;
    literal?: any;
    line: number;
}

export function isDigit(char: string | undefined) {
    if (!char) return false;
    return char.match(/\d/);
}

export function isDigitOrDot(char: string | undefined) {
    if (!char) return false;
    return char.match(/[\d.]/);
}

export function isAlpha(char: string | undefined) {
    if (!char) return false;
    return char.match(/[a-zA-Z_]/);
}

export function isAlphaNumeric(char: string | undefined) {
    return isAlpha(char) || isDigit(char);
}
