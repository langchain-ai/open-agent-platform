# Agent Development Workflow Guide

## Quick Reference Commands

### While Coding (Run Frequently)

```bash
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/open-agent-platform/apps/web
npm run check
```

**Shows:** Type errors, linting issues, missing implementations, unused variables
**Speed:** ~30 seconds
**When:** After every significant code change

### Before Marking Task Complete

```bash
npm run fix
```

**Does:** Auto-fixes formatting and auto-fixable linting issues
**Speed:** ~15 seconds
**When:** Before you consider your work done

### Final Verification

```bash
npm run build:internal
```

**Does:** Full production build with all checks
**Speed:** ~2-3 minutes
**When:** Before committing or when user requests full validation

---

## Development Workflow

### 1. Start Development

```bash
npm run dev
# App runs at http://localhost:3000 (or check terminal for port)
```

### 2. Make Changes

- Write code in the appropriate feature directory (`src/features/`)
- Follow TypeScript strict typing
- Use existing shadcn/ui components from `src/components/ui/`

### 3. Check Your Work (Run Often!)

```bash
npm run check
```

Fix all errors shown before proceeding.

### 4. Auto-Fix What You Can

```bash
npm run fix
```

### 5. Final Build Test

```bash
npm run build:internal
```

### 6. Commit

Only commit if build passes with zero errors.

---

## Project Standards & Conventions

### TypeScript Requirements

- ✅ **Always use strict typing** - no `any` types without explicit reason
- ✅ **Define types** in `src/types/` (shared) or within feature directories (feature-specific)
- ✅ **Use path aliases**: `@/components`, `@/lib`, `@/hooks`, `@/features`
- ✅ **Check types frequently**: Run `npx tsc --noEmit` to see type errors

### Code Organization

```
src/
├── features/          # Feature-based organization
│   ├── agents/       # Agent management
│   ├── chat/         # Chat interface
│   ├── rag/          # RAG functionality
│   ├── tools/        # Tool management
│   └── [feature]/    # Each feature contains:
│       ├── components/   # Feature components
│       ├── hooks/        # Feature hooks
│       └── providers/    # Feature providers
├── components/       # Shared components
│   └── ui/          # shadcn/ui components
├── hooks/           # Shared hooks
├── lib/             # Utility functions
├── providers/       # Global state providers
└── types/           # Shared TypeScript types
```

### UI Components

- ✅ **Use shadcn/ui first** - Check `src/components/ui/` before creating custom components
- ✅ **Style variant**: Project uses "new-york" style
- ✅ **Styling**: Use Tailwind CSS classes
- ✅ **Accessibility**: shadcn/ui components are pre-configured with Radix UI for accessibility

### State Management

- ✅ **Zustand** for configuration state (see `src/providers/Agents.tsx`, `src/providers/Auth.tsx`)
- ✅ **React hooks** for local component state
- ✅ **Not all state needs Zustand** - only shared configuration

### API Routes

- ✅ Place in `src/app/api/` following Next.js App Router conventions
- ✅ Use Next.js 15 App Router patterns

### Code Quality Rules

- ❌ **NO console.log** - Use `console.warn()` or `console.error()` only
- ❌ **NO unused variables** - ESLint will catch these
- ❌ **NO unused imports** - Clean them up
- ✅ **Format with Prettier** - Runs automatically with `npm run fix`
- ✅ **Follow React hooks rules** - ESLint enforces this

---

## Common Issues & Solutions

### "Type error" in build

**Solution:**

```bash
npx tsc --noEmit
# Read the errors, fix the types
```

### "ESLint error" in build

**Solution:**

```bash
npm run lint
# Read the errors, then:
npm run lint:fix  # Auto-fix what's possible
```

### "Formatting issues"

**Solution:**

```bash
npm run format  # Auto-fixes everything
```

### Build fails with lockfile errors

**Solution:**

```bash
# Use npm (not yarn) for all commands:
npm run build:internal
```

### Can't find a component

**Check these locations in order:**

1. `src/components/ui/` - shadcn/ui components
2. `src/components/` - Shared components
3. `src/features/[feature]/components/` - Feature-specific components

---

## Understanding Error Output

### TypeScript Errors

```
src/features/tools/components/tool-card.tsx:45:20
Type error: Property 'name' does not exist on type 'Tool'
```

**Meaning:** Line 45, column 20 - trying to access a property that doesn't exist on the type
**Fix:** Check the type definition and use correct property name

### ESLint Errors

```
src/features/chat/index.tsx
  12:7  error  'unusedVar' is assigned a value but never used  @typescript-eslint/no-unused-vars
```

**Meaning:** Line 12 - variable declared but not used
**Fix:** Remove the variable or use it

### Build Compilation Errors

```
Failed to compile.
./src/components/ui/button.tsx
Module not found: Can't resolve '@/lib/utils'
```

**Meaning:** Import path is wrong or file doesn't exist
**Fix:** Check the import path and file location

---

## Pre-Commit Checklist

Before marking your work complete, verify:

- [ ] `npm run check` passes with 0 errors
- [ ] `npm run fix` has been run
- [ ] `npm run build:internal` completes successfully
- [ ] No console.log statements in code
- [ ] All new code has proper TypeScript types
- [ ] No unused imports or variables
- [ ] Code follows feature-based organization
- [ ] Used shadcn/ui components where applicable

---

## Getting Help

### Check Documentation

- `AGENTS.md` - Project structure and conventions
- `CONCEPTS.md` - Key concepts and patterns
- `README.md` - Setup and getting started

### Useful Commands Reference

```bash
npm run dev              # Start dev server
npm run check            # Fast type & lint check
npm run fix              # Auto-fix formatting & linting
npm run build:internal   # Full production build
npm run lint             # Show linting errors
npm run lint:fix         # Auto-fix linting
npm run format           # Format all files
npm run format:check     # Check formatting only
npx tsc --noEmit         # Type check only
```

### CI Pipeline

The CI pipeline runs on PRs and checks:

- ✅ Formatting (`yarn format:check`)
- ✅ Linting (`yarn lint`)
- ✅ Spelling (codespell)

**Your local build should match CI expectations.**

---

## Quick Start Template

```bash
# 1. Navigate to project
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/open-agent-platform/apps/web

# 2. Start development
npm run dev

# 3. Make changes...

# 4. Check frequently while coding
npm run check

# 5. When done, auto-fix
npm run fix

# 6. Final validation
npm run build:internal

# 7. If all passes, work is complete!
```

---

## Tips for Success

1. **Run `npm run check` often** - Don't wait until the end to find errors
2. **Read error messages carefully** - They tell you exactly what's wrong and where
3. **Use existing patterns** - Look at similar code in the codebase for examples
4. **Type everything** - TypeScript strict mode catches bugs early
5. **Keep commits focused** - One feature or fix per commit
6. **Ask before creating new patterns** - Follow existing conventions first

---

## Environment Notes

- **Package Manager**: Use `npm` for all commands (project has both yarn.lock and package-lock.json, but npm is recommended)
- **Node Version**: 22.18.0 (via nvm)
- **Next.js Version**: 15.3.1
- **TypeScript Version**: 5.7.2
- **Working Directory**: `/mnt/c/00_ConceptV/06_Project_Vi/repos/open-agent-platform/apps/web`
