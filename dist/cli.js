import { Command } from 'commander';
import dotenv from 'dotenv';
import { loadReferences } from './loaders/sources.js';
import { runSection1Classification } from './section1/classifier.js';
dotenv.config();
const program = new Command();
program
    .name('stablecoin-analyzer')
    .description('Generate Stablecoin Fundamentals Section 1 analysis using Perplexity.')
    .version('0.1.0');
program
    .command('section1')
    .description('Run Section 1: Stablecoin Fundamentals > 1.1 Classification')
    .requiredOption('-a, --asset <name>', 'Asset name, e.g., USDC')
    .requiredOption('-i, --issuer <name>', 'Issuer name, e.g., Circle')
    .option('-r, --ref <ref...>', 'References: URLs or local files (can repeat)')
    .option('-t, --tone <tone>', 'Tone: sharp or descriptive', 'descriptive')
    .action(async (opts) => {
    const { asset, issuer, ref = [], tone } = opts;
    const sources = await loadReferences(ref);
    const result = await runSection1Classification({ assetName: asset, issuerName: issuer, sources, tone });
    // Print to stdout
    console.log('\n=== Narrative ===\n');
    console.log(result.narrative);
    console.log('\n=== Analysis ===\n');
    console.log(result.analysis);
});
program.parseAsync(process.argv);
