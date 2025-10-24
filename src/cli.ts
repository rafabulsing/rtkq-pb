#!/usr/bin/env node
import { program } from "commander";
import { schemaToTypes } from ".";

program
  .option("-i, --input <file>")
  .option('-o, --output <file>')
;

program.parse();

const options = program.opts() as { input?: string; output?: string };

if (!options.input) {
  throw new Error("Invalid --input");
}

if (!options.output) {
  throw new Error("Invalid --output");
}

schemaToTypes(options.input, options.output);
