export function report(line: number, location: string, message: string) {
    console.error(`[line ${line}] Error ${location}: ${message}`);
}
