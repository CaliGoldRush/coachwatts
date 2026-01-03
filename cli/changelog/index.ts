
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import { generateCoachAnalysis } from '../../server/utils/gemini';

const changelogCommand = new Command('changelog');

changelogCommand
  .description('Generate user-friendly changelog using Gemini')
  .option('-i, --input <file>', 'Input changelog file', 'CHANGELOG.md')
  .option('-o, --output <file>', 'Output file', 'USER_CHANGELOG.md')
  .option('-w, --write', 'Write to output file instead of stdout', false)
  .action(async (options) => {
    console.log(chalk.blue('=== Generating User Changelog ==='));

    const projectRoot = process.cwd();
    const inputFile = path.resolve(projectRoot, options.input);
    const outputFile = path.resolve(projectRoot, options.output);

    if (!fs.existsSync(inputFile)) {
      console.error(chalk.red(`Error: Input file '${options.input}' not found.`));
      process.exit(1);
    }

    const content = fs.readFileSync(inputFile, 'utf-8');

    // Extract the latest version block
    // Assuming format:
    // ## [version] (date)
    // ... content ...
    // ## [previous version] ...
    
    const lines = content.split('\n');
    let latestVersionBlock = '';
    let foundFirstHeader = false;
    let version = '';

    for (const line of lines) {
      // Changed regex to match single # for version header (standard-version/release-it default)
      // Matches both # [1.0.0] and ## [1.0.0]
      const match = line.match(/^#{1,2}\s+\[(\d+\.\d+\.\d+)\]/);
      if (match) {
        if (foundFirstHeader) {
          break; // Stop when we hit the second header
        }
        foundFirstHeader = true;
        version = match[1];
      }
      
      if (foundFirstHeader) {
        latestVersionBlock += line + '\n';
      }
    }

    if (!latestVersionBlock.trim()) {
      console.error(chalk.red('Error: Could not find latest version in changelog.'));
      process.exit(1);
    }
    
    console.log(chalk.gray(`Found latest version: ${version}`));
    console.log(chalk.gray('Generating summary...'));

    const prompt = `
You are a helpful assistant for Coach Watts, a cycling coaching app.
Here is the technical changelog for the latest release (v${version}):

${latestVersionBlock}

Please rewrite this into a friendly, non-technical announcement for our users (athletes and coaches).
Focus on the value and benefits of the changes.
Group them logically if needed (e.g., "New Features", "Improvements", "Fixes").
Use emojis where appropriate.
Keep it concise but exciting.
Format as Markdown.
    `;

    try {
      const userChangelog = await generateCoachAnalysis(
        prompt, 
        'flash',
        {
          operation: 'generate_changelog',
          entityType: 'System'
        }
      );

      if (options.write) {
        // 1. Update master USER_CHANGELOG.md
        let existingContent = '';
        if (fs.existsSync(outputFile)) {
          existingContent = fs.readFileSync(outputFile, 'utf-8');
        }
        const newContent = userChangelog + '\n\n' + existingContent;
        fs.writeFileSync(outputFile, newContent);
        console.log(chalk.green(`✓ Updated ${options.output}`));

        // 2. Create version-specific release file
        const releasesDir = path.resolve(projectRoot, 'public/content/releases');
        if (!fs.existsSync(releasesDir)) {
          fs.mkdirSync(releasesDir, { recursive: true });
        }
        
        const releaseFile = path.join(releasesDir, `v${version}.md`);
        
        // Add frontmatter for Nuxt Content if needed, or just the content
        // For now, simple markdown content with the version title
        const releaseContent = `# Release v${version}\n\n${userChangelog}`;
        
        fs.writeFileSync(releaseFile, releaseContent);
        console.log(chalk.green(`✓ Created ${path.relative(projectRoot, releaseFile)}`));

      } else {
        console.log(chalk.green(`\n--- User Friendly Changelog (v${version}) ---\n`));
        console.log(userChangelog);
        console.log(chalk.green('\n---------------------------------------------\n'));
      }

    } catch (error) {
      console.error(chalk.red('Error generating changelog with Gemini:'), error);
      process.exit(1);
    }
  });

export default changelogCommand;
