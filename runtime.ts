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
        die("environment", `variable ${token.lexeme} is not defined`, token.line);
    };
}
