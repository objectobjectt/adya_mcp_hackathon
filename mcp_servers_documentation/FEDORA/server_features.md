# fedora linux mcp server overview

## what is the fedora linux mcp server?
the fedora linux mcp server is a powerful model context protocol (mcp) connector designed for secure, advanced automation and remote management of fedora-based linux systems via a structured api. it exposes a comprehensive set of linux system administration, development, and diagnostic tools, making it ideal for platform automation, devops, and system monitoring use cases.

---

## key features
- ✅ execute allowed linux shell commands safely with strict allowlist
- ✅ retrieve detailed system information and status (cpu, memory, disk, hardware, network, users, security, etc.)
- ✅ advanced package management via dnf (install, remove, search, update, history, etc.)
- ✅ full system service management (start, stop, restart, enable, disable, list, status, etc.)
- ✅ comprehensive file system operations (browse, create, copy, move, delete, archive, extract, permissions, links)
- ✅ network diagnostics (ping, curl, traceroute, nmap, interfaces, connections, dns, bandwidth, etc.)
- ✅ system logs access with advanced filtering (journalctl, grep, priority, time range)
- ✅ real-time and historical system monitoring (cpu, memory, disk, network, io, processes, temperature, swap, etc.)
- ✅ user and group management (list, add, remove, modify users/groups)
- ✅ firewall management (firewall-cmd: status, zones, add/remove services/ports, reload)
- ✅ process management (list/search/kill processes, priorities, tree, top cpu/mem, details)
- ✅ cron and scheduled job management (list, add, remove, edit cron jobs, system jobs)
- ✅ dev and build tools: git, npm, node, python, docker, maven, gradle

---

## capabilities
| capability           | description                                                    |
|----------------------|----------------------------------------------------------------|
| system commands      | safely run a wide set of essential linux commands              |
| system info          | get structured info: hardware, os, memory, disk, network, etc. |
| package management   | full dnf/yum/rpm/flatpak package operations                    |
| service management   | control and inspect systemd services and status                |
| filesystem ops       | directory/file create, copy, move, delete, metadata, archives  |
| network diagnostics  | connectivity and troubleshooting tools                         |
| logs & monitoring    | advanced log retrieval, resource and process monitoring        |
| user/group mgmt      | add/remove/modify/list users and groups                        |
| firewall mgmt        | manage firewall rules, zones, ports, and services              |
| process control      | view/search/kill/inspect running processes                     |
| cron jobs            | manage cron tasks and system scheduled jobs                    |
| development tools    | integrated dev/build tools (git, npm, python, docker, etc.)    |

---

## supported platforms
- fedora linux 34+ (most tools compatible with recent rhel/centos/rocky derivatives)
- requires node.js environment with system command permissions

---

## security notes
- only allows commands from a strict allowlist (no arbitrary code execution)
- operations requiring root may prompt for sudo (configurable)
- user, group, and system info isolated per host
- no persistent credentials stored by default

---

## integration use cases
- devops automation and remote platform management
- monitoring, diagnostics, and troubleshooting for linux servers
- secure system operations for self-hosted apps and ci/cd
- automated database, container, and firewall administration
- developer tooling orchestration and workflow automation

---
