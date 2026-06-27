# Logo Component Usage

## Overview
The `Logo` component is now globally available and can be imported and used anywhere in your application.

## File Location
`src/components/logo.tsx`

## Basic Usage

```tsx
import { Logo } from "@/components/logo";

// Basic usage
<Logo />

// With custom sizing
<Logo className="w-16 h-16" />

// With custom container styling
<Logo className="p-4 bg-white rounded-lg" />

// With children (for adding text next to logo)
<Logo>
  <span className="ml-2 text-xl font-bold">collectibles</span>
</Logo>
```

## Current Implementation
The logo is a 2x2 grid of rounded squares:
- Top-left: Dark brown (#1a0f0a)
- Top-right: Light gray (#d1d5db)
- Bottom-left: Light gray (#d1d5db)
- Bottom-right: Dark brown (#1a0f0a)

Size: 48x48px by default (fully scalable via CSS)

## Example Usage in Home Page
Already implemented in `src/routes/home.tsx`:
```tsx
<div className="flex items-center gap-2">
  <Logo />
  <div>
    <h1 className="text-2xl font-extrabold">collectibles</h1>
    <p className="text-sm text-muted-foreground mt-0.5">
      Track holdings, offers, and orders
    </p>
  </div>
</div>
```

## Customization
The component accepts:
- `className` - Additional CSS classes for styling
- `children` - Optional content to display alongside the logo

## Available Globally
Since the component is exported from `src/components/logo.tsx`, you can import it from anywhere using:
```tsx
import { Logo } from "@/components/logo";
```
