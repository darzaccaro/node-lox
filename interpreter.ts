import { Environment } from "./environment";
import { Assignment, BlockStmt, Decl, VarDecl } from "./parser";

export class Interpreter {
    globals: Environment;
    environment: Environment;
    program: Decl[];
    constructor(program: Decl[]) {
        this.program = program;
        this.globals = new Environment();
        this.environment = this.globals;
        this.globals.define("clock", new Callable(0, (interpreter: Interpreter, args: any[]) => Math.floor(Date.now())));
    }
    interpret() {
        for (const statement of this.program) {
            if (statement instanceof BlockStmt) {
                statement.evaluate(new Environment(this.environment));
            } else {
                statement.evaluate(this.environment);
            }
        }
    }
    // TODO evaluation functions should really be defined here...
}

export class Callable {
    arity: number;
    call: (interpreter: Interpreter, args: any[]) => any;
    constructor(arity: number, call: (interpreter: Interpreter, args: any[]) => any) {
        this.arity = arity;
        this.call = call;
    }
}
