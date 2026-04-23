# Kit

pnpm workspace monorepo: **React UI components**, **CLI** (`kit`), **copy-in modules** (chat, PDF viewer), and a **Vite + React** project scaffold.

## Packages

| Package | Name | Role |
|--------|------|------|
| CLI | `@kit/cli` | `kit` binary: `list`, `create`, `add` |
| Scaffold | `@kit/create` | `kit create` — new Vite + React + TypeScript app |
| UI | `@kit/components` | Published components (`Button`, …), Tailwind, Storybook |
| Chat | `@kit/chat` | `kit add chat` — SSE chat panel, session hook, Markdown (source in `src/`) |
| PDF | `@kit/pdf-viewer` | `kit add pdf-viewer` — viewer wrapper (source in `src/`) |

Workspace layout:

```
packages/
├── cli/                 # kit CLI entry
├── scaffold-vite-react/ # @kit/create — Vite + React template
├── components/          # @kit/components
├── chat/                # @kit/chat (template / workspace dep)
└── pdf-viewer/          # @kit/pdf-viewer (template / workspace dep)
```

## Prerequisites

- Node ≥ 18  
- pnpm ≥ 8 (`packageManager` pinned in root `package.json`)

## Setup

```bash
pnpm install
```

Build CLI and scaffold before using local `pnpm kit`:

```bash
pnpm --filter @kit/cli build
pnpm --filter @kit/create build
```

## CLI

```bash
pnpm kit list
pnpm kit create <project-name>
pnpm kit add chat
pnpm kit add pdf-viewer
```

Aliases in root `package.json`: `pnpm kit`, `pnpm create`.

## Development

```bash
pnpm dev              # all packages that define dev
pnpm storybook        # @kit/components Storybook
pnpm build            # all packages
pnpm test             # all packages
pnpm lint             # ESLint + Stylelint (fix)
pnpm lint:check       # check only
pnpm format           # Prettier
pnpm clean            # clean packages + root node_modules
```

## Releases

Changesets: `pnpm changeset`, `pnpm version`, `pnpm release` (see root scripts).

## License

ISC
