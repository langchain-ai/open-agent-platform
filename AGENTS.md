<general_rules>
Always format code using Prettier before opening a pull request by running `yarn format`. The project uses Prettier with Tailwind CSS plugin and single attribute per line configuration.

Run ESLint to check for code quality issues using `yarn lint` or auto-fix issues with `yarn lint:fix`. The project enforces TypeScript strict rules, React hooks rules, and prohibits console.log (use console.warn or console.error instead).

Follow the feature-based architecture pattern. When creating new functionality, organize code within the appropriate feature directory in `src/features/` (agents, chat, rag, tools, auth). Each feature should contain its own components, hooks, providers, and utilities.

Use shadcn/ui components for UI elements. The project is configured with the "new-york" style variant and uses Radix UI primitives. Before creating custom UI components, check if a shadcn/ui component exists in `src/components/ui/` or can be added via the shadcn CLI.

Always use TypeScript with strict type checking. Define types in `src/types/` for shared interfaces or within feature directories for feature-specific types.

Follow the established path alias conventions: `@/components` for UI components, `@/lib` for utilities, and `@/hooks` for hooks.

Use Zustand for config state management (not all state should be managed by Zustand!) and follow the existing patterns in providers like `src/providers/Agents.tsx` and `src/providers/Auth.tsx`.

When creating new API routes, place them in `src/app/api/` following Next.js App Router conventions.
</general_rules>

<repository_structure>
This is a monorepo using Turbo (v2.5.0) for build orchestration and Yarn workspaces (v3.5.1) for dependency management.

The repository contains two main applications in the `apps/` directory:
- `apps/web/`: Next.js 15.3.1 application with TypeScript, the main web interface
- `apps/docs/`: Mintlify documentation site

The web application (`apps/web/`) follows Next.js App Router architecture with:
- `src/app/`: App router with route groups `(app)` for main application routes and `(auth)` for authentication routes
- `src/features/`: Feature-based organization containing domain-specific functionality:
  - `agents/`: Agent management and templates
  - `chat/`: Chat interface and thread management
  - `rag/`: Retrieval-Augmented Generation functionality
  - `tools/`: Tool management and playground
  - Authentication features (signin, signup, reset-password, etc.)
- `src/components/`: Shared components across features
- `src/components/ui/`: shadcn/ui components and UI primitives
- `src/hooks/`: Shared React hooks
- `src/lib/`: Utility functions and shared logic
- `src/providers/`: React context providers for global state
- `src/types/`: TypeScript type definitions
- `scripts/`: Utility scripts including MCP agent configuration scripts

Key configuration files:
- `components.json`: shadcn/ui configuration with "new-york" style
- `tailwind.config.js`: Tailwind CSS configuration with custom utilities
- `tsconfig.json`: TypeScript configuration with path aliases
- `eslint.config.js`: ESLint configuration with TypeScript and React rules
- `prettier.config.js`: Prettier configuration with Tailwind plugin
</repository_structure>

<dependencies_and_installation>
The project uses Yarn 3.5.1 as the package manager (specified in `packageManager` field). Install dependencies by running `yarn install` from the root directory.

Turbo is used for build orchestration and task running. Available commands:
- `yarn dev`: Start development servers for all apps
- `yarn build`: Build all applications
- `yarn format`: Format code with Prettier across all workspaces
- `yarn lint`: Run ESLint across all workspaces
- `yarn lint:fix`: Auto-fix ESLint issues across all workspaces

The monorepo follows the `apps/*` workspace pattern. Dependencies are managed at both the root level and individual app levels.

Key dependencies include:
- LangGraph SDK (`@langchain/langgraph-sdk`) for agent functionality
- MCP SDK (`@modelcontextprotocol/sdk`) for Model Context Protocol integration
- Shadcn UI (which wraps Radix UI) components for accessible UI primitives
- Supabase for authentication and database
- Tailwind CSS for styling
- Zustand for custom configuration state management
- Next.js 15.3.1 with App Router

Development dependencies include TypeScript 5.7.2, ESLint with TypeScript rules, and Prettier with Tailwind plugin.
</dependencies_and_installation>

<testing_instructions>
Currently, this repository does not have a testing framework configured. There are no test files, testing dependencies (Jest, Vitest, Cypress, Playwright), or test scripts in the package.json files.

The CI pipeline (`.github/workflows/ci.yml`) includes code quality checks (formatting, linting, spell checking) but does not execute tests.


Until testing is properly configured, rely on TypeScript type checking, ESLint rules, and manual testing for code quality assurance.
</testing_instructions>

