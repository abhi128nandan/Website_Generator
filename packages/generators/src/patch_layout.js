const fs = require('fs');
const path = require('path');

const frontendPath = 'c:/website-generator-core/website-generator-core/packages/generators/src/templates/frontend.ts';
let code = fs.readFileSync(frontendPath, 'utf8');

const layoutPrimitivesBlock = `
    const layoutDir = path.join(srcDir, 'components', 'layout');
    await fs.mkdir(layoutDir, { recursive: true });

    await fs.writeFile(path.join(layoutDir, 'PageContainer.tsx'), \`import * as React from "react"\\nimport { cn } from "@/lib/utils"\\n\\nconst PageContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(\\n  ({ className, ...props }, ref) => (\\n    <div\\n      ref={ref}\\n      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}\\n      {...props}\\n    />\\n  )\\n)\\nPageContainer.displayName = "PageContainer"\\n\\nexport { PageContainer }\\n\`);

    await fs.writeFile(path.join(layoutDir, 'DashboardLayout.tsx'), \`import * as React from "react"\\nimport { cn } from "@/lib/utils"\\n\\ninterface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {\\n  sidebar?: React.ReactNode;\\n  header?: React.ReactNode;\\n}\\n\\nconst DashboardLayout = React.forwardRef<HTMLDivElement, DashboardLayoutProps>(\\n  ({ className, sidebar, header, children, ...props }, ref) => (\\n    <div ref={ref} className={cn("flex h-screen w-full overflow-hidden bg-background", className)} {...props}>\\n      {sidebar && (\\n        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80] border-r bg-muted/20">\\n          {sidebar}\\n        </div>\\n      )}\\n      <div className={cn("flex flex-col flex-1", sidebar && "md:pl-64")}>\\n        {header && (\\n          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 sm:px-6 lg:px-8">\\n            {header}\\n          </header>\\n        )}\\n        <main className="flex-1 overflow-y-auto">\\n          <div className="py-6">\\n            {children}\\n          </div>\\n        </main>\\n      </div>\\n    </div>\\n  )\\n)\\nDashboardLayout.displayName = "DashboardLayout"\\n\\nexport { DashboardLayout }\\n\`);

    await fs.writeFile(path.join(layoutDir, 'ResponsiveGrid.tsx'), \`import * as React from "react"\\nimport { cn } from "@/lib/utils"\\n\\ninterface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {\\n  columns?: 1 | 2 | 3 | 4;\\n}\\n\\nconst ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(\\n  ({ className, columns = 3, ...props }, ref) => {\\n    const gridCols = {\\n      1: "grid-cols-1",\\n      2: "grid-cols-1 sm:grid-cols-2",\\n      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",\\n      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",\\n    }[columns];\\n\\n    return (\\n      <div\\n        ref={ref}\\n        className={cn("grid gap-4 md:gap-6", gridCols, className)}\\n        {...props}\\n      />\\n    )\\n  }\\n)\\nResponsiveGrid.displayName = "ResponsiveGrid"\\n\\nexport { ResponsiveGrid }\\n\`);
`;

// Insert after the skeleton.tsx scaffold line
const skeletonSearchStr = `await fs.writeFile(path.join(uiDir, 'skeleton.tsx'), \`import { cn } from "@/lib/utils"\\n\\nfunction Skeleton({\\n  className,\\n  ...props\\n}: React.HTMLAttributes<HTMLDivElement>) {\\n  return (\\n    <div\\n      className={cn("animate-pulse rounded-md bg-muted", className)}\\n      {...props}\\n    />\\n  )\\n}\\n\\nexport { Skeleton }\\n\`);`;

if(code.includes(skeletonSearchStr)) {
  code = code.replace(skeletonSearchStr, skeletonSearchStr + "\n" + layoutPrimitivesBlock);
  fs.writeFileSync(frontendPath, code);
  console.log("Patched frontend.ts");
} else {
  console.log("Could not find skeleton.tsx block in frontend.ts");
}

const promptAddition = `
LAYOUT AUTHORITY RULES
Use:
* @/components/layout/PageContainer
* @/components/layout/DashboardLayout
* @/components/layout/ResponsiveGrid

when available.
Do not generate custom layout wrappers.
Do not generate arbitrary max-width containers.
Do not invent responsive grid systems.
Layout primitives are authoritative.

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
