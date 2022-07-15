import { LiteralValue } from "./parser";
import { die } from "./die";
import { Token } from "./tokens";
import { Callable } from "./interpreter";

export class Environment {
    enclosing: Environment;
    constructor(enclosing: Environment = null) {
        this.enclosing = enclosing;
    }
    values: { [key: string]: LiteralValue } = {};
    define = (name: string, value: LiteralValue) => {
        this.values[name] = value;
    };
    get = (token: Token): LiteralValue => {
        if (token.lexeme in this.values) {
            return this.values[token.lexeme];
        }
        if (this.enclosing) {
            return this.enclosing.get(token);
        }
        die("environment", `cannot get variable ${token.lexeme} which is not defined`, token.line);
    };
    set = (token: Token, value: LiteralValue): null => {
        if (token.lexeme in this.values) {
            this.values[token.lexeme] = value;
            return null;
        }
        if (this.enclosing) {
            return this.enclosing.set(token, value);
        }
        die("environment", `cannot set variable ${token.lexeme} which is not defined`, token.line);
    };
}
