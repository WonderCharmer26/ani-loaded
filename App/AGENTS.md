# AGENTS.md

## Build/Lint/Test Commands

- **Build:** `npm run build`
- **Lint:** `eslint .`
- **Test:** (No explicit test command in package.json, assuming component tests are run during build)

## Code Style Guidelines

- **Imports:** Use absolute imports when possible.
- **Formatting:** Follow Prettier/ESLint rules.
- **Types:** Use TypeScript for all components and functions.
- **Naming Conventions:**
  - React components: PascalCase
  - Variables/functions: camelCase
- **Error Handling:** Use `try...catch` blocks for asynchronous operations.
- **React Hooks:** Follow rules of hooks (eslint-plugin-react-hooks).
- **Globals:** Browser globals are available (from eslint config).
- **Unused vars:** Avoid unused variables (eslint rule).
- Things to Remember: supabase has a User interface for handling data with the user.
