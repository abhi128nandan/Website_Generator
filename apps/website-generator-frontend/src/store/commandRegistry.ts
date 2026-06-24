export interface Command {
  id: string;
  label: string;
  icon?: string;
  category: string;
  shortcut?: string[];
  execute: () => void;
}

class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private listeners: Set<() => void> = new Set();

  register(command: Command) {
    this.commands.set(command.id, command);
    this.notify();
  }

  unregister(id: string) {
    this.commands.delete(id);
    this.notify();
  }

  getCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const commandRegistry = new CommandRegistry();
