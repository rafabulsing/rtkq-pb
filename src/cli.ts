#!/usr/bin/env node
import { program } from "commander";
import { dbToTypes } from ".";

program
  .option("-i, --input <file>")
  .option('-o, --output <file>')
  .action(({ input, output }) => {
    if (!input) {
      throw new Error("Invalid --input");
    }

    if (!output) {
      throw new Error("Invalid --output");
    }

    dbToTypes(input, output);
  })
;

program.parse();
