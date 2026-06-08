#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const _1 = require(".");
commander_1.program
    .option("-i, --input <file>")
    .option('-o, --output <file>')
    .option('-c, --config <file>')
    .action(({ input, output, config }) => {
    if (!input) {
        throw new Error("Invalid --input");
    }
    if (!output) {
        throw new Error("Invalid --output");
    }
    if (!config) {
        throw new Error("Invalid --config");
    }
    (0, _1.dbToTypes)(input, output, config);
});
commander_1.program.parse();
//# sourceMappingURL=cli.js.map