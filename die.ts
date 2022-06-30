export function die(location: string, message: string, line?: number) {
    console.error(`[line ${line}] Error ${location}: ${message}`);
    process.exit(65);
}
