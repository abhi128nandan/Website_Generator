const fs = require('fs');
const path = require('path');

const frontendPath = 'c:/website-generator-core/website-generator-core/packages/generators/src/templates/frontend.ts';
let code = fs.readFileSync(frontendPath, 'utf8');

// 1. Dependencies
code = code.replace(`'lucide-react': '^0.408.0'`, `'lucide-react': '^0.408.0',
        'clsx': '^2.1.1',
        'tailwind-merge': '^2.4.0',
        'class-variance-authority': '^0.7.0',
        '@radix-ui/react-slot': '^1.1.0',
        '@radix-ui/react-dialog': '^1.1.1',
        '@radix-ui/react-select': '^2.1.1',
        '@radix-ui/react-label': '^2.1.0'`);
code = code.replace(`tailwindcss: '^3.4.4',`, `tailwindcss: '^3.4.4',\n        'tailwindcss-animate': '^1.0.7',`);
code = code.replace(`vite: '^5.3.4'`, `vite: '^5.3.4',\n        '@types/node': '^20.14.10'`);

// 2. tsconfig
code = code.replace(`"types": ["vite/client"]`, `"types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }`);

// 3. vite.config
code = code.replace(`import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],`, `import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },`);

// 4. tailwind config
code = code.replace(`  theme: {
    extend: {},
  },
  plugins: [],`, `  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],`);

// 5. index.css
code = code.replace(`    const indexCss = \`@tailwind base;
@tailwind components;
@tailwind utilities;
\`;`, `    const indexCss = \`@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
\`;`);

// 6. Scaffold primitives
const scaffoldPrimitivesBlock = `
    const libDir = path.join(srcDir, 'lib');
    await fs.mkdir(libDir, { recursive: true });
    await fs.writeFile(path.join(libDir, 'utils.ts'), \`import { clsx, type ClassValue } from "clsx"\\nimport { twMerge } from "tailwind-merge"\\n\\nexport function cn(...inputs: ClassValue[]) {\\n  return twMerge(clsx(inputs))\\n}\\n\`);

    const uiDir = path.join(srcDir, 'components', 'ui');
    await fs.mkdir(uiDir, { recursive: true });

    await fs.writeFile(path.join(uiDir, 'button.tsx'), \`import * as React from "react"\\nimport { Slot } from "@radix-ui/react-slot"\\nimport { cva, type VariantProps } from "class-variance-authority"\\nimport { cn } from "@/lib/utils"\\n\\nconst buttonVariants = cva(\\n  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",\\n  {\\n    variants: {\\n      variant: {\\n        default: "bg-primary text-primary-foreground hover:bg-primary/90",\\n        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",\\n        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",\\n        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",\\n        ghost: "hover:bg-accent hover:text-accent-foreground",\\n        link: "text-primary underline-offset-4 hover:underline",\\n      },\\n      size: {\\n        default: "h-10 px-4 py-2",\\n        sm: "h-9 rounded-md px-3",\\n        lg: "h-11 rounded-md px-8",\\n        icon: "h-10 w-10",\\n      },\\n    },\\n    defaultVariants: {\\n      variant: "default",\\n      size: "default",\\n    },\\n  }\\n)\\n\\nexport interface ButtonProps\\n  extends React.ButtonHTMLAttributes<HTMLButtonElement>,\\n    VariantProps<typeof buttonVariants> {\\n  asChild?: boolean\\n}\\n\\nconst Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\\n  ({ className, variant, size, asChild = false, ...props }, ref) => {\\n    const Comp = asChild ? Slot : "button"\\n    return (\\n      <Comp\\n        className={cn(buttonVariants({ variant, size, className }))}\\n        ref={ref}\\n        {...props}\\n      />\\n    )\\n  }\\n)\\nButton.displayName = "Button"\\n\\nexport { Button, buttonVariants }\\n\`);

    await fs.writeFile(path.join(uiDir, 'card.tsx'), \`import * as React from "react"\\nimport { cn } from "@/lib/utils"\\n\\nconst Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(\\n  ({ className, ...props }, ref) => (\\n    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />\\n  )\\n)\\nCard.displayName = "Card"\\n\\nconst CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(\\n  ({ className, ...props }, ref) => (\\n    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />\\n  )\\n)\\nCardHeader.displayName = "CardHeader"\\n\\nconst CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(\\n  ({ className, ...props }, ref) => (\\n    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />\\n  )\\n)\\nCardTitle.displayName = "CardTitle"\\n\\nconst CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(\\n  ({ className, ...props }, ref) => (\\n    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />\\n  )\\n)\\nCardDescription.displayName = "CardDescription"\\n\\nconst CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(\\n  ({ className, ...props }, ref) => (\\n    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />\\n  )\\n)\\nCardContent.displayName = "CardContent"\\n\\nconst CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(\\n  ({ className, ...props }, ref) => (\\n    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />\\n  )\\n)\\nCardFooter.displayName = "CardFooter"\\n\\nexport { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }\\n\`);

    await fs.writeFile(path.join(uiDir, 'input.tsx'), \`import * as React from "react"\\nimport { cn } from "@/lib/utils"\\n\\nexport interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}\\n\\nconst Input = React.forwardRef<HTMLInputElement, InputProps>(\\n  ({ className, type, ...props }, ref) => {\\n    return (\\n      <input\\n        type={type}\\n        className={cn(\\n          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",\\n          className\\n        )}\\n        ref={ref}\\n        {...props}\\n      />\\n    )\\n  }\\n)\\nInput.displayName = "Input"\\n\\nexport { Input }\\n\`);

    await fs.writeFile(path.join(uiDir, 'textarea.tsx'), \`import * as React from "react"\\nimport { cn } from "@/lib/utils"\\n\\nexport interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}\\n\\nconst Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(\\n  ({ className, ...props }, ref) => {\\n    return (\\n      <textarea\\n        className={cn(\\n          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",\\n          className\\n        )}\\n        ref={ref}\\n        {...props}\\n      />\\n    )\\n  }\\n)\\nTextarea.displayName = "Textarea"\\n\\nexport { Textarea }\\n\`);

    await fs.writeFile(path.join(uiDir, 'badge.tsx'), \`import * as React from "react"\\nimport { cva, type VariantProps } from "class-variance-authority"\\nimport { cn } from "@/lib/utils"\\n\\nconst badgeVariants = cva(\\n  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",\\n  {\\n    variants: {\\n      variant: {\\n        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",\\n        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",\\n        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",\\n        outline: "text-foreground",\\n      },\\n    },\\n    defaultVariants: {\\n      variant: "default",\\n    },\\n  }\\n)\\n\\nexport interface BadgeProps\\n  extends React.HTMLAttributes<HTMLDivElement>,\\n    VariantProps<typeof badgeVariants> {}\\n\\nfunction Badge({ className, variant, ...props }: BadgeProps) {\\n  return (\\n    <div className={cn(badgeVariants({ variant }), className)} {...props} />\\n  )\\n}\\n\\nexport { Badge, badgeVariants }\\n\`);

    await fs.writeFile(path.join(uiDir, 'alert.tsx'), \`import * as React from "react"\\nimport { cva, type VariantProps } from "class-variance-authority"\\nimport { cn } from "@/lib/utils"\\n\\nconst alertVariants = cva(\\n  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",\\n  {\\n    variants: {\\n      variant: {\\n        default: "bg-background text-foreground",\\n        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",\\n      },\\n    },\\n    defaultVariants: {\\n      variant: "default",\\n    },\\n  }\\n)\\n\\nconst Alert = React.forwardRef<\\n  HTMLDivElement,\\n  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>\\n>(({ className, variant, ...props }, ref) => (\\n  <div\\n    ref={ref}\\n    role="alert"\\n    className={cn(alertVariants({ variant }), className)}\\n    {...props}\\n  />\\n))\\nAlert.displayName = "Alert"\\n\\nconst AlertTitle = React.forwardRef<\\n  HTMLParagraphElement,\\n  React.HTMLAttributes<HTMLHeadingElement>\\n>(({ className, ...props }, ref) => (\\n  <h5\\n    ref={ref}\\n    className={cn("mb-1 font-medium leading-none tracking-tight", className)}\\n    {...props}\\n  />\\n))\\nAlertTitle.displayName = "AlertTitle"\\n\\nconst AlertDescription = React.forwardRef<\\n  HTMLParagraphElement,\\n  React.HTMLAttributes<HTMLParagraphElement>\\n>(({ className, ...props }, ref) => (\\n  <div\\n    ref={ref}\\n    className={cn("text-sm [&_p]:leading-relaxed", className)}\\n    {...props}\\n  />\\n))\\nAlertDescription.displayName = "AlertDescription"\\n\\nexport { Alert, AlertTitle, AlertDescription }\\n\`);

    await fs.writeFile(path.join(uiDir, 'dialog.tsx'), \`import * as React from "react"\\nimport * as DialogPrimitive from "@radix-ui/react-dialog"\\nimport { X } from "lucide-react"\\nimport { cn } from "@/lib/utils"\\n\\nconst Dialog = DialogPrimitive.Root\\nconst DialogTrigger = DialogPrimitive.Trigger\\nconst DialogPortal = DialogPrimitive.Portal\\nconst DialogClose = DialogPrimitive.Close\\n\\nconst DialogOverlay = React.forwardRef<\\n  React.ElementRef<typeof DialogPrimitive.Overlay>,\\n  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>\\n>(({ className, ...props }, ref) => (\\n  <DialogPrimitive.Overlay\\n    ref={ref}\\n    className={cn(\\n      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",\\n      className\\n    )}\\n    {...props}\\n  />\\n))\\nDialogOverlay.displayName = DialogPrimitive.Overlay.displayName\\n\\nconst DialogContent = React.forwardRef<\\n  React.ElementRef<typeof DialogPrimitive.Content>,\\n  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>\\n>(({ className, children, ...props }, ref) => (\\n  <DialogPortal>\\n    <DialogOverlay />\\n    <DialogPrimitive.Content\\n      ref={ref}\\n      className={cn(\\n        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",\\n        className\\n      )}\\n      {...props}\\n    >\\n      {children}\\n      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">\\n        <X className="h-4 w-4" />\\n        <span className="sr-only">Close</span>\\n      </DialogPrimitive.Close>\\n    </DialogPrimitive.Content>\\n  </DialogPortal>\\n))\\nDialogContent.displayName = DialogPrimitive.Content.displayName\\n\\nconst DialogHeader = ({\\n  className,\\n  ...props\\n}: React.HTMLAttributes<HTMLDivElement>) => (\\n  <div\\n    className={cn(\\n      "flex flex-col space-y-1.5 text-center sm:text-left",\\n      className\\n    )}\\n    {...props}\\n  />\\n)\\nDialogHeader.displayName = "DialogHeader"\\n\\nconst DialogFooter = ({\\n  className,\\n  ...props\\n}: React.HTMLAttributes<HTMLDivElement>) => (\\n  <div\\n    className={cn(\\n      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",\\n      className\\n    )}\\n    {...props}\\n  />\\n)\\nDialogFooter.displayName = "DialogFooter"\\n\\nconst DialogTitle = React.forwardRef<\\n  React.ElementRef<typeof DialogPrimitive.Title>,\\n  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>\\n>(({ className, ...props }, ref) => (\\n  <DialogPrimitive.Title\\n    ref={ref}\\n    className={cn(\\n      "text-lg font-semibold leading-none tracking-tight",\\n      className\\n    )}\\n    {...props}\\n  />\\n))\\nDialogTitle.displayName = DialogPrimitive.Title.displayName\\n\\nconst DialogDescription = React.forwardRef<\\n  React.ElementRef<typeof DialogPrimitive.Description>,\\n  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>\\n>(({ className, ...props }, ref) => (\\n  <DialogPrimitive.Description\\n    ref={ref}\\n    className={cn("text-sm text-muted-foreground", className)}\\n    {...props}\\n  />\\n))\\nDialogDescription.displayName = DialogPrimitive.Description.displayName\\n\\nexport {\\n  Dialog,\\n  DialogPortal,\\n  DialogOverlay,\\n  DialogClose,\\n  DialogTrigger,\\n  DialogContent,\\n  DialogHeader,\\n  DialogFooter,\\n  DialogTitle,\\n  DialogDescription,\\n}\\n\`);

    await fs.writeFile(path.join(uiDir, 'skeleton.tsx'), \`import { cn } from "@/lib/utils"\\n\\nfunction Skeleton({\\n  className,\\n  ...props\\n}: React.HTMLAttributes<HTMLDivElement>) {\\n  return (\\n    <div\\n      className={cn("animate-pulse rounded-md bg-muted", className)}\\n      {...props}\\n    />\\n  )\\n}\\n\\nexport { Skeleton }\\n\`);
`;

code = code.replace(`    await fs.writeFile(path.join(srcDir, 'index.css'), indexCss);`, `    await fs.writeFile(path.join(srcDir, 'index.css'), indexCss);\n${scaffoldPrimitivesBlock}`);

fs.writeFileSync(frontendPath, code);

// Update generators
const promptAddition = `
UI AUTHORITY RULES
Use components from:
@/components/ui

Prefer:
* Button
* Card
* Input
* Textarea
* Badge
* Alert
* Dialog
* Skeleton

Do not generate raw HTML equivalents when an authority component exists.
Examples:
Use Button instead of button.
Use Card instead of div-based containers.
Use Dialog instead of handcrafted modal logic.
Primitive implementations are forbidden.
Only compose existing primitives.

`;

const hybridPath = 'c:/website-generator-core/website-generator-core/packages/generators/src/generators/hybrid-generator.ts';
let hybridCode = fs.readFileSync(hybridPath, 'utf8');
hybridCode = hybridCode.replace('STRICT CONTRACT ENFORCEMENT:', promptAddition + 'STRICT CONTRACT ENFORCEMENT:');
fs.writeFileSync(hybridPath, hybridCode);

const frontendGenPath = 'c:/website-generator-core/website-generator-core/packages/generators/src/generators/frontend-generator.ts';
let frontendGenCode = fs.readFileSync(frontendGenPath, 'utf8');
frontendGenCode = frontendGenCode.replace('STRICT CONTRACT ENFORCEMENT:', promptAddition + 'STRICT CONTRACT ENFORCEMENT:');
fs.writeFileSync(frontendGenPath, frontendGenCode);

console.log("Success");
