#!/usr/bin/env node
const { program } = require('commander');
const chalk = require('chalk');
const { convert } = require('../src/index');
const path = require('path');

program
    .name('word-to-latex')
    .description('Convert PDF, Word, Excel, HTML to LaTeX')
    .version('1.0.0');

program
    .command('convert <input>')
    .description('Convert a file to LaTeX')
    .option('-o, --output <file>', 'Output file (default: same name with .tex)')
    .option('-t, --type <type>', 'Force input type: pdf|word|excel|html')
    .action(async (input, options) => {
        const output = options.output || input.replace(/\.[^/.]+$/, '') + '.tex';
        console.log(chalk.blue(`\n📄 Converting: ${input}`));
        console.log(chalk.gray(`📁 Output: ${output}\n`));

        try {
            await convert(input, output, options.type);
            console.log(chalk.green('✅ Done!'));
        } catch (err) {
            console.error(chalk.red('❌ Error: ' + err.message));
            process.exit(1);
        }
    });

program.parse();