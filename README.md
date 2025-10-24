# HubLocal

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Hub Editor (Dashboard > Hub > Edit)

The hub page editor provides a drag-and-drop canvas and autosave.

- Drag new elements/widgets from the left sidebar into the scene. Works with HTML5 DnD and supports text/plain fallback.
- Select a device preview (mobile/tablet/desktop) and adjust zoom (75–150%).
- Click an element to select it; edit its styles/props in the Inspector on the right.
- Shortcuts: Ctrl/Cmd+Z (undo), Shift+Ctrl/Cmd+Z or Ctrl/Cmd+Y (redo), Ctrl/Cmd+C/X/V (copy/cut/paste), Delete/Backspace (remove).
- Header actions: Undo/Redo, Duplicate, Delete, Export/Import JSON, and per-page route metadata.

Autosave persists to `/api/hubs/[id]` as you edit. A small badge in the header shows save state.
