import { LiteralValue } from "./parser";
import { die } from "./die";
import { Token } from "./tokens";

export class Environment {
    values: { [key: string]: LiteralValue } = {};
    define = (name: string, value: LiteralValue) => {
        this.values[name] = value;
    };
    get = (token: Token): LiteralValue => {
        if (token.lexeme in this.values) {
            return this.values[token.lexeme];
        }
        die("environment", `cannot get variable ${token.lexeme} which is not defined`, token.line);
    };
    set = (token: Token, value: LiteralValue): null => {
        if (token.lexeme in this.values) {
            this.values[token.lexeme] = value;
            return null;
        }
        die("environment", `cannot set variable ${token.lexeme} which is not defined`, token.line);
    };
}
