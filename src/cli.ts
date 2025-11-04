#!/usr/bin/env node
import { program } from "commander";
import { dbToTypes } from ".";

program
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

    dbToTypes(input, output, config);
  })
;

program.parse();
