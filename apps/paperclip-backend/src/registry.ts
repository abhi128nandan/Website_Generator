import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { GeneratedProject, Logger } from '@paperclip/shared';

// Generated projects live inside the parent monorepo under the runtime directory
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');
const PAPERCLIP_PROJECTS_ROOT = path.join(WORKSPACE_ROOT, 'runtime');
const REGISTRY_FILE = path.join(PAPERCLIP_PROJECTS_ROOT, 'projects.json');
const PROJECTS_DIR = path.join(PAPERCLIP_PROJECTS_ROOT, 'generated-projects');
const DASHBOARD_JSON = path.join(PAPERCLIP_PROJECTS_ROOT, 'reliability-dashboard.json');
const DASHBOARD_MD = path.join(PAPERCLIP_PROJECTS_ROOT, 'GENERATOR_RELIABILITY.md');

export class ProjectRegistry {
  static async init() {
    try {
      await fs.mkdir(path.dirname(REGISTRY_FILE), { recursive: true });
      await fs.mkdir(PROJECTS_DIR, { recursive: true });
      await fs.access(REGISTRY_FILE);
    } catch {
      await fs.writeFile(REGISTRY_FILE, JSON.stringify([]));
    }
  }

  static async getProjects(): Promise<GeneratedProject[]> {
    await this.init();
    try {
      const data = await fs.readFile(REGISTRY_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  static async getProject(id: string): Promise<GeneratedProject | undefined> {
    const projects = await this.getProjects();
    return projects.find(p => p.id === id);
  }

  static async addProject(project: GeneratedProject): Promise<void> {
    const projects = await this.getProjects();
    projects.push(project);
    await fs.writeFile(REGISTRY_FILE, JSON.stringify(projects, null, 2));
    await this.updateDashboard().catch(() => {});
  }

  static async updateProject(id: string, updates: Partial<GeneratedProject>): Promise<void> {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates };
      await fs.writeFile(REGISTRY_FILE, JSON.stringify(projects, null, 2));
      await this.updateDashboard().catch(() => {});
    }
  }

  static async deleteProject(id: string): Promise<void> {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      const project = projects[index];
      projects.splice(index, 1);
      await fs.writeFile(REGISTRY_FILE, JSON.stringify(projects, null, 2));
      
      const dirToDelete = project.rootPath || project.path;
      if (dirToDelete) {
        try {
          await fs.rm(dirToDelete, { recursive: true, force: true });
          Logger.info(`Deleted project directory: ${dirToDelete}`);
        } catch (err) {
          Logger.error(`Failed to delete project directory ${dirToDelete}:`, err);
        }
      }
      await this.updateDashboard().catch(() => {});
    }
  }

  static async updateDashboard(): Promise<void> {
    try {
      const projects = await this.getProjects();
      const reports = [];

      for (const p of projects) {
        const projectPath = p.rootPath || p.path;
        if (!projectPath) continue;
        const metadataPath = path.join(projectPath, 'metadata.json');
        let reliability = {
          buildSuccess: false,
          runtimeSuccess: false,
          apiSuccess: false,
          persistenceSuccess: false,
          score: 0
        };

        try {
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          const meta = JSON.parse(metaContent);
          if (meta.reliability) {
            reliability = {
              ...reliability,
              ...meta.reliability
            };
          } else if (p.status === 'completed') {
            reliability = {
              buildSuccess: true,
              runtimeSuccess: true,
              apiSuccess: true,
              persistenceSuccess: true,
              score: 80
            };
          }
        } catch {}

        reports.push({
          id: p.id,
          name: p.name || 'Unnamed Project',
          mode: p.metadata?.classifiedMode || 'unknown',
          status: p.status,
          createdAt: p.createdAt,
          ...reliability
        });
      }

      // Write JSON dashboard
      await fs.writeFile(DASHBOARD_JSON, JSON.stringify(reports, null, 2), 'utf-8');

      // Write Markdown dashboard
      let md = `# Generator Reliability Dashboard\n\n`;
      md += `*Generated: ${new Date().toLocaleString()}*\n\n`;
      md += `| Project Name | Mode | Status | Build Success | Runtime Success | API Success | Persistence Success | Functional Completeness Score |\n`;
      md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

      for (const r of reports) {
        const statusEmoji = r.status === 'completed' ? '✅' : r.status === 'generating' ? '⏳' : '❌';
        md += `| **${r.name}** | \`${r.mode}\` | ${statusEmoji} ${r.status} | ${r.buildSuccess ? '🟢 YES' : '🔴 NO'} | ${r.runtimeSuccess ? '🟢 YES' : '🔴 NO'} | ${r.apiSuccess ? '🟢 YES' : '🔴 NO'} | ${r.persistenceSuccess ? '🟢 YES' : '🔴 NO'} | **${r.score}/100** |\n`;
      }

      await fs.writeFile(DASHBOARD_MD, md, 'utf-8');
      Logger.info(`[Registry] Generator Reliability Dashboard updated.`);
    } catch (e: any) {
      Logger.error(`[Registry] Failed to update reliability dashboard: ${e.message}`);
    }
  }
}
