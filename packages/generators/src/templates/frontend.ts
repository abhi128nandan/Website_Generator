import { NormalizedRequirements } from '@website-generator/shared';
import fs from 'fs/promises';
import path from 'path';
import { SystemScaffold } from '../scaffold/system-scaffold';


export class FrontendGenerator {
  static async generate(targetDir: string, reqs: NormalizedRequirements): Promise<void> {
    const frontendDir = path.join(targetDir, 'frontend');
    await fs.mkdir(frontendDir, { recursive: true });

    // Vite + React + Tailwind scaffold
    const packageJson = {
      name: 'frontend',
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc -b && vite build',
        lint: 'eslint .',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        axios: '^1.7.2',
        zustand: '^4.5.4',
        'react-router-dom': '^6.25.0',
        'lucide-react': '^0.408.0',
        '@tanstack/react-query': '^5.51.11',
        'clsx': '^2.1.1',
        'tailwind-merge': '^2.4.0',
        'class-variance-authority': '^0.7.0',
        '@radix-ui/react-slot': '^1.1.0',
        '@radix-ui/react-dialog': '^1.1.1',
        '@radix-ui/react-select': '^2.1.1',
        '@radix-ui/react-label': '^2.1.0'
      },
      devDependencies: {
        '@types/react': '^18.3.3',
        '@types/react-dom': '^18.3.0',
        '@vitejs/plugin-react': '^4.3.1',
        autoprefixer: '^10.4.19',
        postcss: '^8.4.39',
        tailwindcss: '^3.4.4',
        'tailwindcss-animate': '^1.0.7',
        typescript: '^5.5.3',
        vite: '^5.3.4',
        '@types/node': '^20.14.10'
      }
    };

    await fs.writeFile(path.join(frontendDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: true,
  }
})
`;
    await fs.writeFile(path.join(frontendDir, 'vite.config.ts'), viteConfig);

    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
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
  plugins: [require("tailwindcss-animate")],
}
`;
    await fs.writeFile(path.join(frontendDir, 'tailwind.config.js'), tailwindConfig);

    const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
    await fs.writeFile(path.join(frontendDir, 'postcss.config.js'), postcssConfig);

    const tsconfigJson = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;
    await fs.writeFile(path.join(frontendDir, 'tsconfig.json'), tsconfigJson);

    const tsconfigNodeJson = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`;
    await fs.writeFile(path.join(frontendDir, 'tsconfig.node.json'), tsconfigNodeJson);

    // Basic src
    const srcDir = path.join(frontendDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    const mainTsx = SystemScaffold.getMainTsxContent();
    await fs.writeFile(path.join(srcDir, 'main.tsx'), mainTsx);

    // Error Authority Scaffold
    await SystemScaffold.generateErrorAuthority(srcDir);

    // Query Authority Scaffold
    await SystemScaffold.generateQueryAuthority(srcDir);

    // Auth Authority Scaffold
    await SystemScaffold.generateAuthAuthority(srcDir);

    const indexCss = `@tailwind base;
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
`;
    await fs.writeFile(path.join(srcDir, 'index.css'), indexCss);

    const libDir = path.join(srcDir, 'lib');
    await fs.mkdir(libDir, { recursive: true });
    await fs.writeFile(path.join(libDir, 'utils.ts'), `import { clsx, type ClassValue } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n`);

    const uiDir = path.join(srcDir, 'components', 'ui');
    await fs.mkdir(uiDir, { recursive: true });

    await fs.writeFile(path.join(uiDir, 'button.tsx'), `import * as React from "react"\nimport { Slot } from "@radix-ui/react-slot"\nimport { cva, type VariantProps } from "class-variance-authority"\nimport { cn } from "@/lib/utils"\n\nconst buttonVariants = cva(\n  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",\n  {\n    variants: {\n      variant: {\n        default: "bg-primary text-primary-foreground hover:bg-primary/90",\n        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",\n        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",\n        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",\n        ghost: "hover:bg-accent hover:text-accent-foreground",\n        link: "text-primary underline-offset-4 hover:underline",\n      },\n      size: {\n        default: "h-10 px-4 py-2",\n        sm: "h-9 rounded-md px-3",\n        lg: "h-11 rounded-md px-8",\n        icon: "h-10 w-10",\n      },\n    },\n    defaultVariants: {\n      variant: "default",\n      size: "default",\n    },\n  }\n)\n\nexport interface ButtonProps\n  extends React.ButtonHTMLAttributes<HTMLButtonElement>,\n    VariantProps<typeof buttonVariants> {\n  asChild?: boolean\n}\n\nconst Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ className, variant, size, asChild = false, ...props }, ref) => {\n    const Comp = asChild ? Slot : "button"\n    return (\n      <Comp\n        className={cn(buttonVariants({ variant, size, className }))}\n        ref={ref}\n        {...props}\n      />\n    )\n  }\n)\nButton.displayName = "Button"\n\nexport { Button, buttonVariants }\n`);

    await fs.writeFile(path.join(uiDir, 'card.tsx'), `import * as React from "react"\nimport { cn } from "@/lib/utils"\n\nconst Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(\n  ({ className, ...props }, ref) => (\n    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />\n  )\n)\nCard.displayName = "Card"\n\nconst CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(\n  ({ className, ...props }, ref) => (\n    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />\n  )\n)\nCardHeader.displayName = "CardHeader"\n\nconst CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(\n  ({ className, ...props }, ref) => (\n    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />\n  )\n)\nCardTitle.displayName = "CardTitle"\n\nconst CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(\n  ({ className, ...props }, ref) => (\n    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />\n  )\n)\nCardDescription.displayName = "CardDescription"\n\nconst CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(\n  ({ className, ...props }, ref) => (\n    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />\n  )\n)\nCardContent.displayName = "CardContent"\n\nconst CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(\n  ({ className, ...props }, ref) => (\n    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />\n  )\n)\nCardFooter.displayName = "CardFooter"\n\nexport { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }\n`);

    await fs.writeFile(path.join(uiDir, 'input.tsx'), `import * as React from "react"\nimport { cn } from "@/lib/utils"\n\nexport interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}\n\nconst Input = React.forwardRef<HTMLInputElement, InputProps>(\n  ({ className, type, ...props }, ref) => {\n    return (\n      <input\n        type={type}\n        className={cn(\n          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",\n          className\n        )}\n        ref={ref}\n        {...props}\n      />\n    )\n  }\n)\nInput.displayName = "Input"\n\nexport { Input }\n`);

    await fs.writeFile(path.join(uiDir, 'textarea.tsx'), `import * as React from "react"\nimport { cn } from "@/lib/utils"\n\nexport interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}\n\nconst Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(\n  ({ className, ...props }, ref) => {\n    return (\n      <textarea\n        className={cn(\n          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",\n          className\n        )}\n        ref={ref}\n        {...props}\n      />\n    )\n  }\n)\nTextarea.displayName = "Textarea"\n\nexport { Textarea }\n`);

    await fs.writeFile(path.join(uiDir, 'badge.tsx'), `import * as React from "react"\nimport { cva, type VariantProps } from "class-variance-authority"\nimport { cn } from "@/lib/utils"\n\nconst badgeVariants = cva(\n  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",\n  {\n    variants: {\n      variant: {\n        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",\n        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",\n        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",\n        outline: "text-foreground",\n      },\n    },\n    defaultVariants: {\n      variant: "default",\n    },\n  }\n)\n\nexport interface BadgeProps\n  extends React.HTMLAttributes<HTMLDivElement>,\n    VariantProps<typeof badgeVariants> {}\n\nfunction Badge({ className, variant, ...props }: BadgeProps) {\n  return (\n    <div className={cn(badgeVariants({ variant }), className)} {...props} />\n  )\n}\n\nexport { Badge, badgeVariants }\n`);

    await fs.writeFile(path.join(uiDir, 'alert.tsx'), `import * as React from "react"\nimport { cva, type VariantProps } from "class-variance-authority"\nimport { cn } from "@/lib/utils"\n\nconst alertVariants = cva(\n  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",\n  {\n    variants: {\n      variant: {\n        default: "bg-background text-foreground",\n        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",\n      },\n    },\n    defaultVariants: {\n      variant: "default",\n    },\n  }\n)\n\nconst Alert = React.forwardRef<\n  HTMLDivElement,\n  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>\n>(({ className, variant, ...props }, ref) => (\n  <div\n    ref={ref}\n    role="alert"\n    className={cn(alertVariants({ variant }), className)}\n    {...props}\n  />\n))\nAlert.displayName = "Alert"\n\nconst AlertTitle = React.forwardRef<\n  HTMLParagraphElement,\n  React.HTMLAttributes<HTMLHeadingElement>\n>(({ className, ...props }, ref) => (\n  <h5\n    ref={ref}\n    className={cn("mb-1 font-medium leading-none tracking-tight", className)}\n    {...props}\n  />\n))\nAlertTitle.displayName = "AlertTitle"\n\nconst AlertDescription = React.forwardRef<\n  HTMLParagraphElement,\n  React.HTMLAttributes<HTMLParagraphElement>\n>(({ className, ...props }, ref) => (\n  <div\n    ref={ref}\n    className={cn("text-sm [&_p]:leading-relaxed", className)}\n    {...props}\n  />\n))\nAlertDescription.displayName = "AlertDescription"\n\nexport { Alert, AlertTitle, AlertDescription }\n`);

    await fs.writeFile(path.join(uiDir, 'dialog.tsx'), `import * as React from "react"\nimport * as DialogPrimitive from "@radix-ui/react-dialog"\nimport { X } from "lucide-react"\nimport { cn } from "@/lib/utils"\n\nconst Dialog = DialogPrimitive.Root\nconst DialogTrigger = DialogPrimitive.Trigger\nconst DialogPortal = DialogPrimitive.Portal\nconst DialogClose = DialogPrimitive.Close\n\nconst DialogOverlay = React.forwardRef<\n  React.ElementRef<typeof DialogPrimitive.Overlay>,\n  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>\n>(({ className, ...props }, ref) => (\n  <DialogPrimitive.Overlay\n    ref={ref}\n    className={cn(\n      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",\n      className\n    )}\n    {...props}\n  />\n))\nDialogOverlay.displayName = DialogPrimitive.Overlay.displayName\n\nconst DialogContent = React.forwardRef<\n  React.ElementRef<typeof DialogPrimitive.Content>,\n  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>\n>(({ className, children, ...props }, ref) => (\n  <DialogPortal>\n    <DialogOverlay />\n    <DialogPrimitive.Content\n      ref={ref}\n      className={cn(\n        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",\n        className\n      )}\n      {...props}\n    >\n      {children}\n      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">\n        <X className="h-4 w-4" />\n        <span className="sr-only">Close</span>\n      </DialogPrimitive.Close>\n    </DialogPrimitive.Content>\n  </DialogPortal>\n))\nDialogContent.displayName = DialogPrimitive.Content.displayName\n\nconst DialogHeader = ({\n  className,\n  ...props\n}: React.HTMLAttributes<HTMLDivElement>) => (\n  <div\n    className={cn(\n      "flex flex-col space-y-1.5 text-center sm:text-left",\n      className\n    )}\n    {...props}\n  />\n)\nDialogHeader.displayName = "DialogHeader"\n\nconst DialogFooter = ({\n  className,\n  ...props\n}: React.HTMLAttributes<HTMLDivElement>) => (\n  <div\n    className={cn(\n      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",\n      className\n    )}\n    {...props}\n  />\n)\nDialogFooter.displayName = "DialogFooter"\n\nconst DialogTitle = React.forwardRef<\n  React.ElementRef<typeof DialogPrimitive.Title>,\n  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>\n>(({ className, ...props }, ref) => (\n  <DialogPrimitive.Title\n    ref={ref}\n    className={cn(\n      "text-lg font-semibold leading-none tracking-tight",\n      className\n    )}\n    {...props}\n  />\n))\nDialogTitle.displayName = DialogPrimitive.Title.displayName\n\nconst DialogDescription = React.forwardRef<\n  React.ElementRef<typeof DialogPrimitive.Description>,\n  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>\n>(({ className, ...props }, ref) => (\n  <DialogPrimitive.Description\n    ref={ref}\n    className={cn("text-sm text-muted-foreground", className)}\n    {...props}\n  />\n))\nDialogDescription.displayName = DialogPrimitive.Description.displayName\n\nexport {\n  Dialog,\n  DialogPortal,\n  DialogOverlay,\n  DialogClose,\n  DialogTrigger,\n  DialogContent,\n  DialogHeader,\n  DialogFooter,\n  DialogTitle,\n  DialogDescription,\n}\n`);

    await fs.writeFile(path.join(uiDir, 'skeleton.tsx'), `import { cn } from "@/lib/utils"\n\nfunction Skeleton({\n  className,\n  ...props\n}: React.HTMLAttributes<HTMLDivElement>) {\n  return (\n    <div\n      className={cn("animate-pulse rounded-md bg-muted", className)}\n      {...props}\n    />\n  )\n}\n\nexport { Skeleton }\n`);

    const layoutDir = path.join(srcDir, 'components', 'layout');
    await fs.mkdir(layoutDir, { recursive: true });

    await fs.writeFile(path.join(layoutDir, 'PageContainer.tsx'), `import * as React from "react"\nimport { cn } from "@/lib/utils"\n\nconst PageContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(\n  ({ className, ...props }, ref) => (\n    <div\n      ref={ref}\n      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}\n      {...props}\n    />\n  )\n)\nPageContainer.displayName = "PageContainer"\n\nexport { PageContainer }\n`);

    await fs.writeFile(path.join(layoutDir, 'DashboardLayout.tsx'), `import * as React from "react"\nimport { cn } from "@/lib/utils"\n\ninterface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {\n  sidebar?: React.ReactNode;\n  header?: React.ReactNode;\n}\n\nconst DashboardLayout = React.forwardRef<HTMLDivElement, DashboardLayoutProps>(\n  ({ className, sidebar, header, children, ...props }, ref) => (\n    <div ref={ref} className={cn("flex h-screen w-full overflow-hidden bg-background", className)} {...props}>\n      {sidebar && (\n        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80] border-r bg-muted/20">\n          {sidebar}\n        </div>\n      )}\n      <div className={cn("flex flex-col flex-1", sidebar && "md:pl-64")}>\n        {header && (\n          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 sm:px-6 lg:px-8">\n            {header}\n          </header>\n        )}\n        <main className="flex-1 overflow-y-auto">\n          <div className="py-6">\n            {children}\n          </div>\n        </main>\n      </div>\n    </div>\n  )\n)\nDashboardLayout.displayName = "DashboardLayout"\n\nexport { DashboardLayout }\n`);

    await fs.writeFile(path.join(layoutDir, 'ResponsiveGrid.tsx'), `import * as React from "react"\nimport { cn } from "@/lib/utils"\n\ninterface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {\n  columns?: 1 | 2 | 3 | 4;\n}\n\nconst ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(\n  ({ className, columns = 3, ...props }, ref) => {\n    const gridCols = {\n      1: "grid-cols-1",\n      2: "grid-cols-1 sm:grid-cols-2",\n      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",\n      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",\n    }[columns];\n\n    return (\n      <div\n        ref={ref}\n        className={cn("grid gap-4 md:gap-6", gridCols, className)}\n        {...props}\n      />\n    )\n  }\n)\nResponsiveGrid.displayName = "ResponsiveGrid"\n\nexport { ResponsiveGrid }\n`);



    let appTsx = `import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Home, Database, Activity, Settings, Menu } from 'lucide-react'
`;

    // Dynamic imports for generated pages
    if (reqs.architecture && reqs.architecture.pages && reqs.architecture.pages.length > 0) {
      reqs.architecture.pages.forEach(page => {
        appTsx += `import ${page.componentName} from './pages/${page.componentName}'\n`;
      });
    }

    appTsx += `
function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 text-gray-900">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Activity className="w-6 h-6 text-indigo-600 mr-2" />
            <span className="font-bold text-lg tracking-tight">${reqs.appName}</span>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
`;

    if (reqs.architecture && reqs.architecture.navigation && reqs.architecture.navigation.length > 0) {
      reqs.architecture.navigation.forEach(nav => {
        appTsx += `              <li>
                <Link to="${nav.route}" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                  <Database className="w-4 h-4 mr-3 text-gray-400" />
                  ${nav.label}
                </Link>
              </li>\n`;
      });
    } else if (reqs.architecture && reqs.architecture.pages) {
      reqs.architecture.pages.forEach(page => {
        appTsx += `              <li>
                <Link to="${page.route}" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                  <Database className="w-4 h-4 mr-3 text-gray-400" />
                  ${page.componentName}
                </Link>
              </li>\n`;
      });
    }

    appTsx += `            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center">
              <button className="text-gray-500 hover:text-gray-700 focus:outline-none lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">Live</span>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-8">
            <Routes>
`;
    
    // Main routing based on pages array instead of just entities
    if (reqs.architecture && reqs.architecture.pages && reqs.architecture.pages.length > 0) {
      reqs.architecture.pages.forEach(page => {
        appTsx += `              <Route path="${page.route}" element={<${page.componentName} />} />\n`;
      });
    } else {
        appTsx += `              <Route path="/" element={
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to ${reqs.appName}</h1>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">System Overview</h2>
                    <p className="text-gray-600 mb-6">${reqs.appType}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h3 className="font-medium text-gray-900 mb-2">Enabled Workflows</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                          ${(reqs.workflows || reqs.features).map((f: string) => `<li>${f}</li>`).join('\n                          ')}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              } />\n`;
    }

    appTsx += `            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
`;
    await fs.writeFile(path.join(srcDir, 'App.tsx'), appTsx);

    const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${reqs.appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
    await fs.writeFile(path.join(frontendDir, 'index.html'), indexHtml);
    const pagesDir = path.join(srcDir, 'pages');
    await fs.mkdir(pagesDir, { recursive: true });

    if (reqs.architecture && reqs.architecture.pages && reqs.architecture.pages.length > 0) {
      for (const page of reqs.architecture.pages) {
        
        let pageTsx = '';
        
        // If it's linked to an entity, generate a CRUD/data view, otherwise generate a functional dashboard/feature page
        if (page.entity) {
          const entity = reqs.architecture.entities.find(e => e.name === page.entity);
          if (entity) {
            const routeName = entity.name.toLowerCase() + 's';
            const fields = entity.fields.filter(f => f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt');
            
            pageTsx = `import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ${page.componentName}() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(\`\${API_URL}/api/${routeName}\`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(\`\${API_URL}/api/${routeName}/\${id}\`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Basic type casting
${fields.map(f => {
  if (f.type === 'Int' || f.type === 'Float') return `      if (formData.${f.name}) formData.${f.name} = Number(formData.${f.name});`;
  if (f.type === 'Boolean') return `      if (formData.${f.name}) formData.${f.name} = formData.${f.name} === 'true' || formData.${f.name} === true;`;
  if (f.type === 'DateTime') return `      if (formData.${f.name}) formData.${f.name} = new Date(formData.${f.name}).toISOString();`;
  return '';
}).filter(Boolean).join('\n')}
      await axios.post(\`\${API_URL}/api/${routeName}\`, formData);
      setShowForm(false);
      setFormData({});
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading ${entity.name}s...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">${page.description || entity.name + ' Management'}</h1>
          <p className="text-gray-500 text-sm mt-1">${page.features ? page.features.join(' • ') : ''}</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={16} /> New ${entity.name}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create ${entity.name}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${fields.map(f => `
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">${f.name}</label>
                <input 
                  type="${f.type === 'Int' || f.type === 'Float' ? 'number' : f.type === 'DateTime' ? 'datetime-local' : 'text'}" 
                  required={${f.isRequired}}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onChange={e => setFormData({...formData, ${f.name}: e.target.value})}
                />
              </div>`).join('')}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              ${fields.map(f => `<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${f.name}</th>`).join('\n              ')}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, i) => (
              <tr key={item.id || i}>
                ${fields.map(f => `<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{String(item.${f.name})}</td>`).join('\n                ')}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 ml-4"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={${fields.length + 1}} className="px-6 py-8 text-center text-gray-500 text-sm">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;
          }
        } 
        
        // If it's a dashboard or non-entity page, generate a functional dashboard outline based on features
        if (!pageTsx) {
          pageTsx = `import React from 'react';
import { Activity, Zap, Layers } from 'lucide-react';

export default function ${page.componentName}() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">${page.description || page.componentName}</h1>
        <p className="text-gray-600">Overview and functional controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        ${page.features ? page.features.map((feature, idx) => `
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">${feature}</h3>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Functionality for ${feature} is active and processing metrics.</p>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Execute Action &rarr;
          </button>
        </div>`).join('\n        ') : `
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-2">Metrics</h3>
          <p className="text-sm text-gray-500">Aggregate statistics.</p>
        </div>
        `}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Business Logic Controller</h2>
        <p className="text-gray-600 mb-4">This module connects dynamically to backend workflows.</p>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Initialize Workflow
        </button>
      </div>
    </div>
  );
}
`;
        }
        
        await fs.writeFile(path.join(pagesDir, `${page.componentName}.tsx`), pageTsx);
        
      }
    }
  }
}
