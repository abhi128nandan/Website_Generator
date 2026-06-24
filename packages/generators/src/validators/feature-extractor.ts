import fs from 'fs/promises';
import path from 'path';

export interface CoverageFeature {
  category: string;
  feature: string;
  implemented: boolean;
  evidence: string[];
}

export class FeatureExtractor {
  static async extract(targetDir: string): Promise<CoverageFeature[]> {
    const features: CoverageFeature[] = [];
    const allFiles = await this.readAllFiles(targetDir);

    // 1. Prisma Models
    const prismaModels = this.extractRegexGroups(allFiles, /model\s+([A-Za-z0-9_]+)\s+\{/g, 'Prisma Model', 'Database Entities', '.prisma');
    features.push(...prismaModels);

    // 2. Backend Routes (CRUD)
    const backendRoutes = this.extractRegexGroups(allFiles, /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g, 'Backend Route', 'Routes', '.ts');
    features.push(...backendRoutes);

    // 3. Frontend Routes
    const frontendRoutes = this.extractRegexGroups(allFiles, /<Route\s+[^>]*path=['"]([^'"]+)['"]/g, 'Frontend Route', 'Routes', '.tsx');
    features.push(...frontendRoutes);

    // 4. Forms
    const formUsages = this.extractPresence(allFiles, /(<form|onSubmit=|useForm\()/g, 'Form Implementation', 'Forms', '.tsx');
    features.push(...formUsages);

    // 5. Validation Rules
    const validationUsages = this.extractPresence(allFiles, /(z\.object|yup\.object|joi\.|validator)/g, 'Validation Schema', 'Validation', '.ts');
    features.push(...validationUsages);

    // 6. API Integrations / CRUD in Frontend
    const apiIntegrations = this.extractPresence(allFiles, /(fetch\(|axios\.|useQuery\.|useMutation\()/g, 'API Integration/Data Fetching', 'API Integrations', '.ts');
    features.push(...apiIntegrations);

    // 7. Loading States
    const loadingStates = this.extractPresence(allFiles, /(isLoading|isPending|<Spinner|Loading\.\.\.|Skeleton)/g, 'Loading State Handled', 'Loading States', '.tsx');
    features.push(...loadingStates);

    // 8. Error States
    const errorStates = this.extractPresence(allFiles, /(isError|error &&|<ErrorBoundary|<Alert|catch\s*\()/g, 'Error State Handled', 'Error States', '.ts');
    features.push(...errorStates);

    // 9. Client-Side Interactivity
    const interactivity = this.extractPresence(allFiles, /(onClick=|onChange=|onSubmit=|onKeyDown=|onKeyUp=)/g, 'Client-Side Event Handlers', 'Interactivity', '.tsx');
    features.push(...interactivity);

    // 10. React State Management
    const stateManagement = this.extractPresence(allFiles, /(useState\(|useReducer\(|useEffect\(|useRef\(|useMemo\(|useCallback\()/g, 'React State Hooks', 'State Management', '.tsx');
    features.push(...stateManagement);

    // 11. Domain/Mathematical Logic
    const domainLogic = this.extractPresence(allFiles, /(Math\.|parseInt\(|parseFloat\(|\beval\(|[-+*/%]\s*=|\b\w+\s*[-+*/%]\s*\w+\b)/g, 'Domain/Math Logic', 'Business Logic', '.ts');
    features.push(...domainLogic);

    // Filter out duplicated evidence or empty features
    return features.filter(f => f.evidence.length > 0);
  }

  private static async readAllFiles(dirPath: string, rootDir: string = dirPath): Promise<{ relativePath: string; content: string }[]> {
    let results: { relativePath: string; content: string }[] = [];
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Skip node_modules, dist, .git
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;

        if (entry.isDirectory()) {
          results = results.concat(await this.readAllFiles(fullPath, rootDir));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.prisma'))) {
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const relativePath = path.relative(rootDir, fullPath);
            results.push({ relativePath, content });
          } catch (e) {
            // ignore unreadable files
          }
        }
      }
    } catch {
      // directory might not exist
    }
    return results;
  }

  private static extractRegexGroups(files: { relativePath: string; content: string }[], regex: RegExp, featurePrefix: string, category: string, fileExtensionFilter: string): CoverageFeature[] {
    const featureMap = new Map<string, CoverageFeature>();

    for (const file of files) {
      if (!file.relativePath.endsWith(fileExtensionFilter)) continue;

      let match;
      const localRegex = new RegExp(regex); // clone
      while ((match = localRegex.exec(file.content)) !== null) {
        const value = match.length > 2 ? `[${match[1].toUpperCase()}] ${match[2]}` : match[1];
        const featureName = `${featurePrefix}: ${value}`;
        
        if (!featureMap.has(featureName)) {
          featureMap.set(featureName, {
            category,
            feature: featureName,
            implemented: true,
            evidence: []
          });
        }
        
        const feature = featureMap.get(featureName)!;
        const evidenceStr = file.relativePath.replace(/\\/g, '/');
        if (!feature.evidence.includes(evidenceStr)) {
          feature.evidence.push(evidenceStr);
        }
      }
    }

    return Array.from(featureMap.values());
  }

  private static extractPresence(files: { relativePath: string; content: string }[], regex: RegExp, featureName: string, category: string, fileExtensionFilter: string): CoverageFeature[] {
    const featureMap = new Map<string, CoverageFeature>();

    for (const file of files) {
      if (!file.relativePath.includes(fileExtensionFilter) && !file.relativePath.endsWith('x')) {
        // loose extension check, e.g. .ts matches .ts and .tsx, but if we pass .tsx it only matches .tsx
        if (fileExtensionFilter === '.tsx' && !file.relativePath.endsWith('.tsx')) continue;
        if (fileExtensionFilter === '.ts' && (!file.relativePath.endsWith('.ts') && !file.relativePath.endsWith('.tsx'))) continue;
      }

      if (regex.test(file.content)) {
        if (!featureMap.has(featureName)) {
          featureMap.set(featureName, {
            category,
            feature: featureName,
            implemented: true,
            evidence: []
          });
        }
        
        const feature = featureMap.get(featureName)!;
        const evidenceStr = file.relativePath.replace(/\\/g, '/');
        if (!feature.evidence.includes(evidenceStr)) {
          feature.evidence.push(evidenceStr);
        }
      }
    }

    return Array.from(featureMap.values());
  }
}
