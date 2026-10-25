# responsivecn

A shadcn registry of responsive overlays. Each component renders the desktop
component at 768px and up, and its mobile counterpart below:

| Pair              | Responsive component |
| ----------------- | -------------------- |
| Dialog → Drawer   | `DialogDrawer`       |
| Sheet → Drawer    | `SheetDrawer`        |
| Popover → Drawer  | `PopoverDrawer`      |
| Tooltip → Popover | `TooltipPopover`     |

Each component is one file that builds on your own shadcn components, so it
works on Base UI and Radix. It is a drop-in replacement for the desktop
component: same props, on the root and on every part.

## Install

In a shadcn project:

```bash
npx shadcn@latest add @responsivecn/dialog-drawer
```

If the `@responsivecn` namespace does not resolve yet, use the full URL:

```bash
npx shadcn@latest add https://responsive-cn.dev/r/dialog-drawer.json
```

## Docs

Read the docs at [responsive-cn.dev/docs](https://responsive-cn.dev/docs).

## Development

```bash
pnpm install
pnpm dev               # docs site on http://localhost:3000
pnpm test              # unit tests
pnpm registry:build    # builds the registry into public/r
```
