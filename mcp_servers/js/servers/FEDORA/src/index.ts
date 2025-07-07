#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as os from 'os';
import { spawn } from 'child_process';

// ================ INTERFACES ================
interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
}

// ================ SERVER SETUP ================
const systemConfig = {
  currentUser: os.userInfo().username,
  workingDirectory: process.cwd(),
  version: '2.0.0',
  platform: os.platform(),
  architecture: os.arch(),
  hostname: os.hostname(),
  homeDirectory: os.homedir(),
  totalMemory: os.totalmem(),
  freeMemory: os.freemem(),
  cpus: os.cpus().length,
  uptime: os.uptime()
};
const allowedCommands = new Set([
  // Basic file operations
  'ls', 'cat', 'pwd', 'whoami', 'find', 'grep', 'head', 'tail', 'wc', 'sort', 'uniq', 'cut', 'awk', 'sed',
  'file', 'stat', 'du', 'tree', 'less', 'more', 'touch', 'ln', 'readlink',

  // System info
  'uname', 'uptime', 'date', 'free', 'df', 'ps', 'top', 'htop', 'systemctl', 'lscpu', 'lsmem', 'lsblk',
  'lsusb', 'lspci', 'lsof', 'who', 'w', 'last', 'lastlog', 'id', 'groups', 'mount', 'umount',
  'hostnamectl', 'timedatectl', 'localectl', 'loginctl', 'systemd-analyze', 'dmesg', 'lsmod', 'modinfo',

  // Package management
  'dnf', 'rpm', 'yum', 'flatpak', 'snap', 'appstream', 'dnf-automatic',

  // Network
  'ping', 'curl', 'wget', 'ip', 'ss', 'netstat', 'nmap', 'dig', 'nslookup', 'host', 'traceroute',
  'arp', 'route', 'ifconfig', 'iwconfig', 'nmcli', 'firewall-cmd', 'iptables', 'nc', 'telnet',

  // Development
  'git', 'node', 'npm', 'python3', 'pip3', 'gcc', 'g++', 'make', 'cmake', 'java', 'javac',
  'docker', 'podman', 'kubectl', 'helm', 'ansible', 'terraform', 'vagrant',

  // File management
  'mkdir', 'cp', 'mv', 'rm', 'chmod', 'chown', 'chgrp', 'rsync', 'scp', 'tar', 'gzip', 'gunzip',
  'zip', 'unzip', 'xz', 'bzip2', 'bunzip2', 'md5sum', 'sha256sum', 'sha1sum',

  // System utilities
  'sudo', 'journalctl', 'crontab', 'at', 'batch', 'kill', 'killall', 'pkill', 'pgrep', 'nohup',
  'screen', 'tmux', 'watch', 'timeout', 'sleep', 'sync', 'reboot', 'shutdown', 'halt',

  // Text processing
  'vim', 'nano', 'emacs', 'diff', 'patch', 'tr', 'expand', 'unexpand', 'fold', 'fmt', 'pr',
  'column', 'paste', 'join', 'split', 'csplit', 'strings', 'hexdump', 'od',

  // System monitoring
  'iostat', 'vmstat', 'sar', 'mpstat', 'pidstat', 'iotop', 'nethogs', 'iftop', 'tcpdump',
  'wireshark', 'tshark', 'strace', 'ltrace', 'gdb', 'perf', 'valgrind', 'sensors',

  // Archive and compression
  'cpio', 'ar', 'compress', 'uncompress', 'zcat', 'bzcat', 'xzcat', '7z', 'rar', 'unrar',

  // Database
  'mysql', 'mariadb', 'postgresql', 'sqlite3', 'redis-cli', 'mongo', 'mongosh',

  // Security
  'gpg', 'openssl', 'ssh', 'ssh-keygen', 'ssh-copy-id', 'sshfs', 'fail2ban-client',
  'chage', 'passwd', 'usermod', 'useradd', 'userdel', 'groupadd', 'groupdel', 'groupmod',

  // Environment
  'env', 'printenv', 'export', 'unset', 'which', 'type', 'whereis', 'locate', 'updatedb',
  'history', 'alias', 'unalias', 'jobs', 'bg', 'fg', 'disown',

  // Hardware
  'lshw', 'dmidecode', 'hdparm', 'smartctl', 'fdisk', 'parted', 'lsblk', 'blkid',
  'findmnt', 'df', 'du', 'ncdu', 'baobab'
]);

// Create server instance
const server = new McpServer({
  name: "fedora-linux-mcp",
  version: systemConfig.version,
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Helper function for executing commands with better error handling
async function executeCommand(commandString: string, options: { timeout?: number; cwd?: string } = {}): Promise<CommandResult> {
  const parts = commandString.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  if (!allowedCommands.has(command)) {
    throw new Error(`Command '${command}' is not allowed`);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || systemConfig.workingDirectory,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => stdout += data.toString());
    child.stderr?.on('data', (data) => stderr += data.toString());

    child.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code || 0,
        command: commandString
      });
    });

    child.on('error', (error) => {
      reject(new Error(`Command failed: ${error.message}`));
    });

    // Configurable timeout (default 30 seconds)
    const timeout = options.timeout || 30000;
    setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);
  });
}

// ================ ENHANCED TOOLS ================

// 1. Execute Raw Commands (Enhanced)
server.tool(
  "execute-command",
  "Execute system commands in Fedora Linux ",
  {
    command: z.string().describe("Command to execute (e.g., 'ls -la', 'ps aux')"),
    timeout: z.number().default(30000).describe("Timeout in milliseconds"),
    cwd: z.string().optional().describe("Working directory for command execution")
  },
  async ({ command, timeout, cwd }) => {
    try {
      const result = await executeCommand(command, { timeout, cwd });
      return {
        content: [{
          type: "text" as const,
          text: `Command: ${result.command}\nExit Code: ${result.exitCode}\nWorking Directory: ${cwd || systemConfig.workingDirectory}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error executing command: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 2. Enhanced System Information
server.tool(
  "get-system-info",
  "Get comprehensive system information with detailed categories",
  {
    category: z.enum(['basic', 'memory', 'disk', 'network', 'processes', 'hardware', 'kernel', 'users', 'security']).default('basic').describe("Type of system information to retrieve")
  },
  async ({ category }) => {
    try {
      let commands: string[] = [];

      switch (category) {
        case 'basic':
          commands = ['uname -a', 'uptime', 'whoami', 'hostnamectl --static', 'date', 'timedatectl'];
          break;
        case 'memory':
          commands = ['free -h', 'ps aux --sort=-%mem | head -10', 'cat /proc/meminfo | head -20'];
          break;
        case 'disk':
          commands = ['df -h', 'lsblk', 'du -sh /var/log /tmp /home', 'findmnt'];
          break;
        case 'network':
          commands = ['ip addr show', 'ss -tuln', 'nmcli connection show', 'cat /etc/resolv.conf'];
          break;
        case 'processes':
          commands = ['ps aux --sort=-%cpu | head -15', 'systemctl list-units --state=running | head -20'];
          break;
        case 'hardware':
          commands = ['lscpu', 'lsmem', 'lsblk', 'lsusb', 'lspci'];
          break;
        case 'kernel':
          commands = ['uname -r', 'lsmod | head -20', 'dmesg | tail -20', 'cat /proc/version'];
          break;
        case 'users':
          commands = ['who', 'w', 'last | head -10', 'cat /etc/passwd | tail -10'];
          break;
        case 'security':
          commands = ['sudo firewall-cmd --list-all', 'systemctl status firewalld', 'ls -la /etc/ssh/', 'cat /etc/fstab'];
          break;
      }

      const results = await Promise.all(
        commands.map(cmd => executeCommand(cmd).catch(err => ({
          stdout: `Error: ${err.message}`,
          stderr: '',
          exitCode: 1,
          command: cmd
        })))
      );

      const output = results.map((r, i) =>
        `$ ${commands[i]}\n${r.stdout}${r.stderr ? `\nSTDERR: ${r.stderr}` : ''}\n`
      ).join('\n');

      return {
        content: [{
          type: "text" as const,
          text: `System Info - ${category}:\n\n${output}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error getting system info: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 3. Fixed Package Management
server.tool(
  "manage-packages",
  "Install, remove, or search for packages using DNF with proper error handling",
  {
    action: z.enum(['install', 'remove', 'search', 'update', 'info', 'list-installed', 'list-available', 'history']).describe("Package management action"),
    packages: z.array(z.string()).optional().describe("Package names to manage (not needed for some actions)"),
    options: z.string().optional().describe("Additional DNF options"),
    assumeYes: z.boolean().default(true).describe("Assume yes to prompts")
  },
  async ({ action, packages = [], options = '', assumeYes }) => {
    try {
      const packageList = packages.join(' ');
      const yesFlag = assumeYes ? '-y' : '';
      let command = '';

      switch (action) {
        case 'install':
          if (packages.length === 0) throw new Error('Packages required for install action');
          command = `sudo dnf install ${packageList} ${yesFlag} ${options}`;
          break;
        case 'remove':
          if (packages.length === 0) throw new Error('Packages required for remove action');
          command = `sudo dnf remove ${packageList} ${yesFlag} ${options}`;
          break;
        case 'search':
          if (packages.length === 0) throw new Error('Search term required for search action');
          command = `dnf search ${packageList} ${options}`;
          break;
        case 'update':
          command = packages.length > 0 ?
            `sudo dnf update ${packageList} ${yesFlag} ${options}` :
            `sudo dnf update ${yesFlag} ${options}`;
          break;
        case 'info':
          if (packages.length === 0) throw new Error('Package name required for info action');
          command = `dnf info ${packageList} ${options}`;
          break;
        case 'list-installed':
          command = `dnf list installed ${packageList} ${options}`;
          break;
        case 'list-available':
          command = `dnf list available ${packageList} ${options}`;
          break;
        case 'history':
          command = `dnf history ${options}`;
          break;
      }

      const result = await executeCommand(command, { timeout: 120000 }); // 2 minutes timeout for package operations

      return {
        content: [{
          type: "text" as const,
          text: `Package ${action}${packageList ? ` for: ${packageList}` : ''}:\n\nCommand: ${command}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error managing packages: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 4. Enhanced Service Management
server.tool(
  "manage-services",
  "Control systemd services with comprehensive options",
  {
    action: z.enum(['status', 'start', 'stop', 'restart', 'reload', 'enable', 'disable', 'mask', 'unmask', 'list', 'list-failed', 'is-active', 'is-enabled']).describe("Service action"),
    service: z.string().optional().describe("Service name (not required for list actions)"),
    options: z.string().optional().describe("Additional systemctl options")
  },
  async ({ action, service, options = '' }) => {
    try {
      let command = '';

      if (['list', 'list-failed'].includes(action)) {
        command = action === 'list' ?
          `systemctl list-units --type=service ${options}` :
          `systemctl list-units --type=service --state=failed ${options}`;
      } else {
        if (!service) {
          throw new Error('Service name is required for this action');
        }

        const needsSudo = ['start', 'stop', 'restart', 'reload', 'enable', 'disable', 'mask', 'unmask'].includes(action);
        command = `${needsSudo ? 'sudo ' : ''}systemctl ${action} ${service} ${options}`;
      }

      const result = await executeCommand(command);

      return {
        content: [{
          type: "text" as const,
          text: `Service ${action}${service ? ` for ${service}` : ''}:\n\nCommand: ${command}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error managing service: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 5. Enhanced File System Operations
server.tool(
  "filesystem-operations",
  "Perform comprehensive file system operations",
  {
    operation: z.enum(['list', 'create-dir', 'create-file', 'copy', 'move', 'delete', 'find', 'permissions', 'ownership', 'links', 'archive', 'extract']).describe("File system operation"),
    path: z.string().describe("Target path for the operation"),
    destination: z.string().optional().describe("Destination path (for copy/move operations)"),
    content: z.string().optional().describe("Content for file creation"),
    options: z.string().optional().describe("Additional options for the operation"),
    recursive: z.boolean().default(false).describe("Recursive operation where applicable")
  },
  async ({ operation, path, destination, content, options = '', recursive }) => {
    try {
      let command = '';
      const recursiveFlag = recursive ? '-r' : '';

      switch (operation) {
        case 'list':
          command = `ls -la ${path} ${options}`;
          break;
        case 'create-dir':
          command = `mkdir -p ${path} ${options}`;
          break;
        case 'create-file':
          if (content) {
            command = `echo "${content}" > ${path}`;
          } else {
            command = `touch ${path} ${options}`;
          }
          break;
        case 'copy':
          if (!destination) throw new Error('Destination is required for copy operation');
          command = `cp ${recursiveFlag} ${path} ${destination} ${options}`;
          break;
        case 'move':
          if (!destination) throw new Error('Destination is required for move operation');
          command = `mv ${path} ${destination} ${options}`;
          break;
        case 'delete':
          command = `rm ${recursiveFlag} ${path} ${options}`;
          break;
        case 'find':
          command = `find ${path} ${options}`;
          break;
        case 'permissions':
          command = `ls -la ${path} ${options}`;
          break;
        case 'ownership':
          command = `ls -la ${path} ${options}`;
          break;
        case 'links':
          command = `ls -la ${path} | grep "^l" ${options}`;
          break;
        case 'archive':
          if (!destination) throw new Error('Destination is required for archive operation');
          command = `tar -czf ${destination} ${path} ${options}`;
          break;
        case 'extract':
          command = `tar -xzf ${path} ${destination ? `-C ${destination}` : ''} ${options}`;
          break;
      }

      const result = await executeCommand(command);

      return {
        content: [{
          type: "text" as const,
          text: `File system ${operation} on ${path}:\n\nCommand: ${command}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error performing filesystem operation: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 6. Enhanced Network Operations
server.tool(
  "network-operations",
  "Perform comprehensive network operations and diagnostics",
  {
    operation: z.enum(['ping', 'curl', 'wget', 'interfaces', 'connections', 'dns', 'routes', 'arp', 'scan', 'trace', 'bandwidth']).describe("Network operation"),
    target: z.string().optional().describe("Target host/URL for network operations"),
    options: z.string().optional().describe("Additional options for the operation"),
    port: z.number().optional().describe("Port number for specific operations")
  },
  async ({ operation, target, options = '', port }) => {
    try {
      let command = '';

      switch (operation) {
        case 'ping':
          if (!target) throw new Error('Target is required for ping operation');
          command = `ping -c 4 ${target} ${options}`;
          break;
        case 'curl':
          if (!target) throw new Error('Target URL is required for curl operation');
          command = `curl -s -I ${target} ${options}`;
          break;
        case 'wget':
          if (!target) throw new Error('Target URL is required for wget operation');
          command = `wget --spider ${target} ${options}`;
          break;
        case 'interfaces':
          command = `ip addr show ${options}`;
          break;
        case 'connections':
          command = `ss -tuln ${port ? `sport = :${port}` : ''} ${options}`;
          break;
        case 'dns':
          if (target) {
            command = `dig ${target} ${options}`;
          } else {
            command = `cat /etc/resolv.conf ${options}`;
          }
          break;
        case 'routes':
          command = `ip route show ${options}`;
          break;
        case 'arp':
          command = `arp -a ${options}`;
          break;
        case 'scan':
          if (!target) throw new Error('Target is required for scan operation');
          command = `nmap -sn ${target} ${options}`;
          break;
        case 'trace':
          if (!target) throw new Error('Target is required for trace operation');
          command = `traceroute ${target} ${options}`;
          break;
        case 'bandwidth':
          command = `ss -i ${options}`;
          break;
      }

      const result = await executeCommand(command);

      return {
        content: [{
          type: "text" as const,
          text: `Network ${operation}${target ? ` for ${target}` : ''}:\n\nCommand: ${command}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error performing network operation: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 7. Enhanced System Logs
server.tool(
  "get-system-logs",
  "Retrieve system logs with advanced filtering options",
  {
    service: z.string().optional().describe("Specific service to get logs for"),
    lines: z.number().default(50).describe("Number of lines to retrieve"),
    since: z.string().optional().describe("Show logs since this time (e.g., '1 hour ago', 'yesterday')"),
    until: z.string().optional().describe("Show logs until this time"),
    priority: z.enum(['emerg', 'alert', 'crit', 'err', 'warning', 'notice', 'info', 'debug']).optional().describe("Log priority level"),
    follow: z.boolean().default(false).describe("Follow log output (real-time)"),
    grep: z.string().optional().describe("Filter logs containing this string")
  },
  async ({ service, lines, since, until, priority, follow, grep }) => {
    try {
      let command = 'journalctl';

      if (service) command += ` -u ${service}`;
      if (since) command += ` --since="${since}"`;
      if (until) command += ` --until="${until}"`;
      if (priority) command += ` -p ${priority}`;
      if (follow) command += ` -f`;
      if (!follow) command += ` -n ${lines}`;
      if (grep) command += ` | grep "${grep}"`;

      const result = await executeCommand(command, { timeout: follow ? 10000 : 30000 });

      return {
        content: [{
          type: "text" as const,
          text: `System logs${service ? ` for ${service}` : ''}:\n\nCommand: ${command}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error retrieving system logs: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 8. Enhanced System Monitoring
server.tool(
  "system-monitoring",
  "Monitor system performance with detailed metrics",
  {
    metric: z.enum(['cpu', 'memory', 'disk', 'network', 'load', 'temperature', 'processes', 'io', 'swap']).describe("System metric to monitor"),
    duration: z.number().default(5).describe("Duration in seconds for monitoring"),
    interval: z.number().default(1).describe("Interval in seconds between measurements"),
    detailed: z.boolean().default(false).describe("Show detailed output")
  },
  async ({ metric, duration, interval, detailed }) => {
    try {
      let command = '';

      switch (metric) {
        case 'cpu':
          command = detailed ?
            `mpstat ${interval} ${duration}` :
            `top -b -n ${duration} -d ${interval} | grep "Cpu(s)"`;
          break;
        case 'memory':
          command = detailed ?
            `free -h -s ${interval} -c ${duration}` :
            `free -h`;
          break;
        case 'disk':
          command = detailed ?
            `iostat -x ${interval} ${duration}` :
            `df -h`;
          break;
        case 'network':
          command = detailed ?
            `sar -n DEV ${interval} ${duration}` :
            `ss -i`;
          break;
        case 'load':
          command = `uptime`;
          break;
        case 'temperature':
          command = `sensors`;
          break;
        case 'processes':
          command = `ps aux --sort=-%cpu | head -15`;
          break;
        case 'io':
          command = `iotop -b -n ${duration} -d ${interval}`;
          break;
        case 'swap':
          command = `swapon --show`;
          break;
      }

      const result = await executeCommand(command);

      return {
        content: [{
          type: "text" as const,
          text: `System monitoring - ${metric}:\n\nCommand: ${command}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error monitoring system: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 9. NEW: User Management
server.tool(
  "user-management",
  "Manage system users and groups",
  {
    action: z.enum(['list-users', 'list-groups', 'user-info', 'group-info', 'add-user', 'delete-user', 'modify-user', 'add-group', 'delete-group']).describe("User management action"),
    username: z.string().optional().describe("Username for user-specific operations"),
    groupname: z.string().optional().describe("Group name for group-specific operations"),
    options: z.string().optional().describe("Additional options for the operation")
  },
  async ({ action, username, groupname, options = '' }) => {
    try {
      let command = '';

      switch (action) {
        case 'list-users':
          command = `cat /etc/passwd | cut -d: -f1,3,4,5,6 | sort`;
          break;
        case 'list-groups':
          command = `cat /etc/group | cut -d: -f1,3 | sort`;
          break;
        case 'user-info':
          if (!username) throw new Error('Username is required for user-info action');
          command = `id ${username} && getent passwd ${username}`;
          break;
        case 'group-info':
          if (!groupname) throw new Error('Group name is required for group-info action');
          command = `getent group ${groupname}`;
          break;
        case 'add-user':
          if (!username) throw new Error('Username is required for add-user action');
          command = `sudo useradd ${username} ${options}`;
          break;
        case 'delete-user':
          if (!username) throw new Error('Username is required for delete-user action');
          command = `sudo userdel ${username} ${options}`;
          break;
        case 'modify-user':
          if (!username) throw new Error('Username is required for modify-user action');
          command = `sudo usermod ${username} ${options}`;
          break;
        case 'add-group':
          if (!groupname) throw new Error('Group name is required for add-group action');
          command = `sudo groupadd ${groupname} ${options}`;
          break;
        case 'delete-group':
          if (!groupname) throw new Error('Group name is required for delete-group action');
          command = `sudo groupdel ${groupname} ${options}`;
          break;
      }

      const result = await executeCommand(command);

      return {
        content: [{
          type: "text" as const,
          text: `User management - ${action}:\n\nCommand: ${command}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error in user management: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 10. NEW: Firewall Management
server.tool(
  "firewall-management",
  "Manage firewall rules and zones using firewall-cmd",
  {
    action: z.enum(['status', 'list-all', 'list-services', 'list-ports', 'add-service', 'remove-service', 'add-port', 'remove-port', 'reload', 'get-zones', 'get-active-zones']).describe("Firewall action"),
    zone: z.string().optional().describe("Firewall zone (default: public)"),
    service: z.string().optional().describe("Service name for service operations"),
    port: z.string().optional().describe("Port number/range for port operations"),
    protocol: z.enum(['tcp', 'udp']).optional().describe("Protocol for port operations"),
    permanent: z.boolean().default(true).describe("Make changes permanent")
  },
  async ({ action, zone = 'public', service, port, protocol, permanent }) => {
    try {
      let command = 'sudo firewall-cmd';
      const permFlag = permanent ? '--permanent' : '';

      switch (action) {
        case 'status':
          command = 'sudo firewall-cmd --state';
          break;
        case 'list-all':
          command = `sudo firewall-cmd --zone=${zone} --list-all`;
          break;
        case 'list-services':
          command = `sudo firewall-cmd --zone=${zone} --list-services`;
          break;
        case 'list-ports':
          command = `sudo firewall-cmd --zone=${zone} --list-ports`;
          break;
        case 'add-service':
          if (!service) throw new Error('Service name is required for add-service action');
          command = `sudo firewall-cmd --zone=${zone} --add-service=${service} ${permFlag}`;
          break;
        case 'remove-service':
          if (!service) throw new Error('Service name is required for remove-service action');
          command = `sudo firewall-cmd --zone=${zone} --remove-service=${service} ${permFlag}`;
          break;
        case 'add-port':
          if (!port || !protocol) throw new Error('Port and protocol are required for add-port action');
          command = `sudo firewall-cmd --zone=${zone} --add-port=${port}/${protocol} ${permFlag}`;
          break;
        case 'remove-port':
          if (!port || !protocol) throw new Error('Port and protocol are required for remove-port action');
          command = `sudo firewall-cmd --zone=${zone} --remove-port=${port}/${protocol} ${permFlag}`;
          break;
        case 'reload':
          command = 'sudo firewall-cmd --reload';
          break;
        case 'get-zones':
          command = 'sudo firewall-cmd --get-zones';
          break;
        case 'get-active-zones':
          command = 'sudo firewall-cmd --get-active-zones';
          break;
      }

      const result = await executeCommand(command);

      return {
        content: [{
          type: "text" as const,
          text: `Firewall management - ${action}:\n\nCommand: ${command}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error managing firewall: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 11. NEW: Process Management
server.tool(
  "process-management",
  "Advanced process management and monitoring",
  {
    action: z.enum(['list', 'search', 'kill', 'killall', 'priority', 'tree', 'top-cpu', 'top-memory', 'details']).describe("Process management action"),
    pattern: z.string().optional().describe("Pattern to search for processes or process name"),
    pid: z.number().optional().describe("Process ID for specific operations"),
    signal: z.string().default('TERM').describe("Signal to send when killing processes"),
    count: z.number().default(10).describe("Number of processes to show")
  },
  async ({ action, pattern, pid, signal, count }) => {
    try {
      let command = '';

      switch (action) {
        case 'list':
          command = `ps aux | head -${count + 1}`;
          break;
        case 'search':
          if (!pattern) throw new Error('Pattern is required for search action');
          command = `ps aux | grep "${pattern}" | grep -v grep`;
          break;
        case 'kill':
          if (!pid) throw new Error('PID is required for kill action');
          command = `kill -${signal} ${pid}`;
          break;
        case 'killall':
          if (!pattern) throw new Error('Process name is required for killall action');
          command = `killall -${signal} ${pattern}`;
          break;
        case 'priority':
          if (!pid) throw new Error('PID is required for priority action');
          command = `ps -o pid,ni,cmd -p ${pid}`;
          break;
        case 'tree':
          command = `pstree ${pid ? `-p ${pid}` : '-p'}`;
          break;
        case 'top-cpu':
          command = `ps aux --sort=-%cpu | head -${count + 1}`;
          break;
        case 'top-memory':
          command = `ps aux --sort=-%mem | head -${count + 1}`;
          break;
        case 'details':
          if (!pid) throw new Error('PID is required for details action');
          command = `ps -f -p ${pid} && cat /proc/${pid}/status 2>/dev/null || echo "Process not found"`;
          break;
      }

      const result = await executeCommand(command);

      return {
        content: [{
          type: "text" as const,
          text: `Process management - ${action}:\n\nCommand: ${command}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error in process management: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);


// 12. NEW: Cron Job Management
server.tool(
  "cron-management",
  "Manage cron jobs and scheduled tasks",
  {
    action: z.enum(['list', 'add', 'remove', 'edit', 'list-system']).describe("Cron management action"),
    user: z.string().optional().describe("User for cron operations (default: current user)"),
    schedule: z.string().optional().describe("Cron schedule (e.g., '0 2 * * *')"),
    command: z.string().optional().describe("Command to schedule"),
    job_id: z.number().optional().describe("Job ID for removal (line number)")
  },
  async ({ action, user, schedule, command, job_id }) => {
    try {
      let cmd = '';

      switch (action) {
        case 'list':
          cmd = user ? `sudo crontab -l -u ${user}` : `crontab -l`;
          break;
        case 'add':
          if (!schedule || !command) throw new Error('Schedule and command are required for add action');
          const userFlag = user ? `-u ${user}` : '';
          cmd = `(crontab -l ${userFlag} 2>/dev/null || echo "") | { cat; echo "${schedule} ${command}"; } | crontab ${userFlag} -`;
          break;
        case 'remove':
          if (!job_id) throw new Error('Job ID (line number) is required for remove action');
          const removeUserFlag = user ? `-u ${user}` : '';
          cmd = `crontab -l ${removeUserFlag} | sed '${job_id}d' | crontab ${removeUserFlag} -`;
          break;
        case 'edit':
          const editUserFlag = user ? `-u ${user}` : '';
          cmd = `crontab -e ${editUserFlag}`;
          break;
        case 'list-system':
          cmd = `ls -la /etc/cron.d/ /etc/cron.daily/ /etc/cron.hourly/ /etc/cron.monthly/ /etc/cron.weekly/`;
          break;
      }

      const result = await executeCommand(cmd);

      return {
        content: [{
          type: "text" as const,
          text: `Cron management - ${action}:\n\nCommand: ${cmd}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error in cron management: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// 13. NEW: Development Tools
server.tool(
  "development-tools",
  "Development and version control tools",
  {
    tool: z.enum(['git', 'npm', 'node', 'python', 'docker', 'maven', 'gradle']).describe("Development tool"),
    action: z.string().describe("Action to perform (e.g., 'status', 'install', 'build', 'test')"),
    project_path: z.string().optional().describe("Project directory path"),
    package_name: z.string().optional().describe("Package name for package managers"),
    options: z.string().optional().describe("Additional options")
  },
  async ({ tool, action, project_path, package_name, options = '' }) => {
    try {
      let cmd = '';
      const workingDir = project_path || systemConfig.workingDirectory;

      switch (tool) {
        case 'git':
          switch (action) {
            case 'status':
              cmd = `git status`;
              break;
            case 'log':
              cmd = `git log --oneline -10`;
              break;
            case 'branch':
              cmd = `git branch -a`;
              break;
            case 'pull':
              cmd = `git pull ${options}`;
              break;
            case 'push':
              cmd = `git push ${options}`;
              break;
            case 'clone':
              if (!package_name) throw new Error('Repository URL is required for clone');
              cmd = `git clone ${package_name} ${options}`;
              break;
            default:
              cmd = `git ${action} ${options}`;
          }
          break;

        case 'npm':
          switch (action) {
            case 'install':
              cmd = package_name ? `npm install ${package_name} ${options}` : `npm install ${options}`;
              break;
            case 'list':
              cmd = `npm list ${options}`;
              break;
            case 'outdated':
              cmd = `npm outdated ${options}`;
              break;
            case 'audit':
              cmd = `npm audit ${options}`;
              break;
            case 'run':
              if (!package_name) throw new Error('Script name is required for run');
              cmd = `npm run ${package_name} ${options}`;
              break;
            default:
              cmd = `npm ${action} ${options}`;
          }
          break;

        case 'node':
          switch (action) {
            case 'version':
              cmd = `node --version`;
              break;
            case 'run':
              if (!package_name) throw new Error('Script file is required for run');
              cmd = `node ${package_name} ${options}`;
              break;
            default:
              cmd = `node ${action} ${options}`;
          }
          break;

        case 'python':
          switch (action) {
            case 'version':
              cmd = `python3 --version`;
              break;
            case 'run':
              if (!package_name) throw new Error('Script file is required for run');
              cmd = `python3 ${package_name} ${options}`;
              break;
            case 'install':
              if (!package_name) throw new Error('Package name is required for install');
              cmd = `pip3 install ${package_name} ${options}`;
              break;
            case 'list':
              cmd = `pip3 list ${options}`;
              break;
            default:
              cmd = `python3 -m ${action} ${options}`;
          }
          break;

        case 'docker':
          cmd = `docker ${action} ${package_name || ''} ${options}`;
          break;

        case 'maven':
          cmd = `mvn ${action} ${options}`;
          break;

        case 'gradle':
          cmd = `gradle ${action} ${options}`;
          break;
      }

      const result = await executeCommand(cmd, { cwd: workingDir, timeout: 120000 });

      return {
        content: [{
          type: "text" as const,
          text: `Development tools (${tool}) - ${action}:\n\nCommand: ${cmd}\nWorking Directory: ${workingDir}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n${result.stderr ? `\nErrors:\n${result.stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Error in development tools: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// ================ MAIN FUNCTION ================
async function main() {
  console.log("Starting Fedora MCP Server...");

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log(`Fedora MCP Server v${systemConfig.version} started for user: ${systemConfig.currentUser}`);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
