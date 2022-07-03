import * as fs from "fs";
import * as readline from "readline";
import { scan } from "./scanner";
import { Parser } from "./parser";

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
    console.log("scanning source...");
    const tokens = scan(source);
    console.log("parsing tokens...");
    const parser = new Parser(tokens);
    console.log("evaluating expression...");
    const expr = parser.expression();

    console.log(expr.toString(), expr.evaluate());
}
