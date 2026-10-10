import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { scenarioCsv, scenarioRows } from "../lib/cfo.ts";
import { loadInvoices } from "../lib/ledger/load.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
writeFileSync(`${root}evidence/cfo-input.csv`, scenarioCsv(scenarioRows(loadInvoices(`${root}ledger`))));
console.log("Wrote evidence/cfo-input.csv");
