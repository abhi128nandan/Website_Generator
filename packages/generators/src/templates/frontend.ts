import { NormalizedRequirements } from '@paperclip/shared';
import fs from 'fs/promises';
import path from 'path';

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
        'lucide-react': '^0.408.0'
      },
      devDependencies: {
        '@types/react': '^18.3.3',
        '@types/react-dom': '^18.3.0',
        '@vitejs/plugin-react': '^4.3.1',
        autoprefixer: '^10.4.19',
        postcss: '^8.4.39',
        tailwindcss: '^3.4.4',
        typescript: '^5.5.3',
        vite: '^5.3.4'
      }
    };

    await fs.writeFile(path.join(frontendDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
  theme: {
    extend: {},
  },
  plugins: [],
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
    "types": ["vite/client"]
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

    const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
    await fs.writeFile(path.join(srcDir, 'main.tsx'), mainTsx);

    const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
    await fs.writeFile(path.join(srcDir, 'index.css'), indexCss);

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
