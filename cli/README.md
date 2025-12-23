# Coach Watts CLI

This CLI provides a set of tools for development, debugging, and maintenance of the Coach Watts application. It is designed to be modular and easy to extend.

## Installation

The CLI uses `tsx` to run TypeScript files directly. Ensure dependencies are installed:

```bash
pnpm install
```

## Usage

You can run the CLI using `tsx`:

```bash
npx tsx cli/index.ts [command] [options]
```

Or add an alias to your shell configuration for easier access:

```bash
alias coach="npx tsx $(pwd)/cli/index.ts"
```

Then you can run:

```bash
coach --help
```

## Commands

### Database (`db`)

Database management commands.

*   **Backup Database:**
    ```bash
    npx tsx cli/index.ts db backup
    ```
    Options:
    *   `-c, --container <name>`: Docker container name (default: `watts-postgres`)
    *   `-o, --output <dir>`: Backup output directory (default: `./backups`)
    *   `-f, --format <format>`: Backup format: `plain`, `custom`, `directory`, `tar` (default: `custom`)

### Check (`check`)

System and configuration validation commands.

*   **Check Database Schema:**
    ```bash
    npx tsx cli/index.ts check db-schema
    ```
    Verifies that critical tables and columns exist in the database.

### Debug (`debug`)

Troubleshooting and debugging commands.

*   **Debug Auth Logic:**
    ```bash
    npx tsx cli/index.ts debug auth-logic
    ```
    Checks environment variables and database records related to authentication, including the bypass user.

## Adding New Commands

1.  Create a new command file in the appropriate subdirectory (e.g., `cli/debug/my-command.ts`).
2.  Define the command using `commander`.
3.  Export the command instance.
4.  Import and register the command in the subdirectory's `index.ts`.

Example `cli/debug/my-command.ts`:

```typescript
import { Command } from 'commander';

const myCommand = new Command('my-command');

myCommand
  .description('Does something useful')
  .action(() => {
    console.log('Hello from my command!');
  });

export default myCommand;
```
