# Project Architecture

This document explains the project structure and conventions used in this Next.js application.

## Overview

This is a Next.js 14+ application using the App Router with TypeScript, Tailwind CSS, ESLint, and Prettier. The architecture is designed for scalability, maintainability, and clarity.

## Folder Structure

```
web/
├── app/                          # Next.js App Router directory
│   ├── layout.tsx               # Root layout (server component)
│   ├── page.tsx                 # Home page (client component)
│   ├── globals.css              # Global styles
│   ├── providers/               # Client-side providers
│   │   └── client-providers.tsx # Wrapper for client providers
│   ├── (routes)/                # Route groups (parentheses don't affect URL)
│   │   └── map/
│   │       └── page.tsx         # Map route
│   └── api/                     # API routes
│       └── ebird/
│           └── recent/
│               └── route.ts     # eBird API route handler
│
├── components/                   # React components
│   ├── ui/                      # Reusable UI components (buttons, inputs, etc.)
│   ├── layout/                  # Layout components (header, footer, etc.)
│   └── common/                  # Common/shared components
│
├── hooks/                        # Custom React hooks
│   └── useGeolocation.ts        # Geolocation hook (placeholder)
│
├── lib/                          # Shared utilities and configurations
│   ├── constants/               # Application constants
│   │   └── index.ts            # Centralized constants
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts            # Shared types and interfaces
│   └── utils/                   # Utility functions
│       └── index.ts            # Helper functions
│
├── styles/                       # Additional stylesheets (if needed)
│
└── public/                       # Static assets
```

## Conventions

### Server vs Client Components

- **Default**: All components are server components by default
- **Client Components**: Must be explicitly marked with `"use client"` directive
- **When to use client components**:
  - Interactive components (onClick, onChange, etc.)
  - Components using hooks (useState, useEffect, etc.)
  - Components using browser APIs

### Imports

- **Absolute Imports**: Use `@/` prefix for all internal imports
  - Example: `import { asNum } from "@/lib/utils"`
  - Configured in `tsconfig.json` with `"@/*": ["./*"]`

### Type Safety

- **Centralized Types**: All shared types live in `lib/types/index.ts`
- **Type Exports**: Export types from a single location for consistency
- **Strict Mode**: TypeScript strict mode is enabled

### Constants

- **Centralized Constants**: All constants live in `lib/constants/index.ts`
- **API Endpoints**: Store API endpoint paths as constants
- **Configuration Values**: Store default values and configuration as constants

### Code Quality

- **ESLint**: Configured with Next.js recommended rules
- **Prettier**: Configured with Tailwind CSS plugin for class sorting
- **Formatting**: Run `npm run format` to format code
- **Linting**: Run `npm run lint` to check for issues

## Key Files Explained

### `app/layout.tsx`
- Root layout component (server component)
- Wraps all pages with providers and global styles
- Sets up fonts and metadata

### `app/providers/client-providers.tsx`
- Client-side provider wrapper
- Use this to add theme providers, state management, etc.
- Wraps children in the root layout

### `app/(routes)/map/page.tsx`
- Example of route groups using parentheses
- Parentheses in folder names don't affect the URL
- Useful for organizing routes without changing URLs

### `lib/utils/index.ts`
- Shared utility functions
- Reusable across the application
- Example: `asNum()` for safe number parsing

### `lib/types/index.ts`
- Shared TypeScript types and interfaces
- Import types from here: `import type { Observation } from "@/lib/types"`

### `lib/constants/index.ts`
- Application-wide constants
- API endpoints, default values, configuration

## Development Workflow

1. **Create Components**: Add to `components/ui/`, `components/layout/`, or `components/common/`
2. **Add Types**: Define types in `lib/types/index.ts`
3. **Add Utilities**: Add helper functions to `lib/utils/index.ts`
4. **Add Constants**: Add constants to `lib/constants/index.ts`
5. **Create Hooks**: Add custom hooks to `hooks/` directory
6. **Format Code**: Run `npm run format` before committing

## Styling

- **Tailwind CSS**: Primary styling approach
- **CSS Modules**: Available if needed for component-specific styles
- **Global Styles**: Defined in `app/globals.css`
- **Theme**: Supports dark mode via CSS variables

## Why This Structure?

1. **Scalability**: Clear separation of concerns makes it easy to add features
2. **Maintainability**: Centralized types, constants, and utilities reduce duplication
3. **Clarity**: Folder structure makes it obvious where to find or add code
4. **Best Practices**: Follows Next.js 14+ App Router conventions
5. **Type Safety**: Centralized types ensure consistency across the application
6. **Developer Experience**: Absolute imports and clear structure improve DX

## Next Steps

- Implement map functionality in `app/(routes)/map/page.tsx`
- Implement geolocation logic in `hooks/useGeolocation.ts`
- Add UI components to `components/ui/`
- Add layout components (header, footer) to `components/layout/`
- Expand type definitions in `lib/types/index.ts` as needed
