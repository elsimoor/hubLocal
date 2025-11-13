# Next.js Project

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

### Puck Editor Layout Primitives

This project includes an extended Puck configuration (`src/lib/puck/config.tsx`) with professional, responsive layout primitives:

-   `Section` – A semantic wrapper with variants (plain, muted, dark, gradient), padding, and centering.
-   `Stack` – A flexible primitive for vertical/horizontal spacing.
-   `ResponsiveFlex` – A flex container with breakpoint-aware `direction` and `gap` properties.
-   `Grid` & `ResponsiveGrid` – Powerful grid containers. `ResponsiveGrid` supports different column counts per breakpoint and includes **layout presets** like "Auto Cards" and "Gallery".
-   `AutoColumns` – An auto-fitting grid that creates columns of a minimum size, wrapping automatically.
-   `Spacer` – A responsive spacer for creating vertical or horizontal space that adapts to breakpoints.
-   `Footer` – A structured multi-column footer with link groups and copyright text.
-   `LayoutItem` – A dynamic wrapper that adds grid/flex controls to any component dropped inside it.

### Editing Experience

-   **Editing Padding**: All layout wrappers include an `editingPadding` field. This adds extra space inside a component *only* during editing, making it easier to drag and drop nested items without them feeling cramped.
-   **Selection Outlines**: All layout components feature clear blue outlines when selected, improving visual feedback.

### Starter Templates

You also get starter templates in the `templates` export:

-   `LandingPage` – A complete page with a Navbar, Hero, feature grid, CTA section, and Footer.
-   `DocsPage` – A two-column documentation layout with a Navbar and Footer.

To seed a new page with a template, set your Puck `data` to one of the template objects:

```ts
import { templates } from '@/lib/puck/config';
const [data, setData] = useState(templates.LandingPage);
```

### Dynamic Placement HOCs

The file `src/lib/puck/layout-hocs.tsx` exports Higher-Order Components (HOCs) that allow you to add dynamic placement fields to any of your existing components:

-   `withGridPlacement(name, component)`: Adds `columns` and `rows` fields when the component is inside a `Grid` or `ResponsiveGrid`.
-   `withFlexPlacement(name, component)`: Adds `flexGrow`, `flexShrink`, and `flexBasis` fields when inside a flex container.
-   `withGridAndFlexPlacement(name, component)`: Composes both HOCs.

**Usage:**

```tsx
// In src/lib/puck/config.tsx
import { withGridAndFlexPlacement } from './layout-hocs';

// Example: Enhance an existing Card component
const cardWithPlacement = withGridAndFlexPlacement('Card', config.components.Card);

// Add it to your final exported components
config.components = { ...config.components, ...cardWithPlacement };
```

Then open the Puck editor page and customize components via drag & drop. All new layout wrappers accept arbitrary nested components in their slot fields.

