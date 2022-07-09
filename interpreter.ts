import { Environment } from "./environment";
import { Assignment, BlockStmt, Decl, VarDecl } from "./parser";

export class Interpreter {
    environment: Environment;
    program: Decl[];
    constructor(program: Decl[]) {
        this.program = program;
        this.environment = new Environment();
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
