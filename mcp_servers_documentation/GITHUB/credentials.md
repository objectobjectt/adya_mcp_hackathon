# GITHUB MCP Server Credentials

## Overview
This document provides instructions on obtaining and structuring the credentials needed to connect the GitHub MCP Server in the Vanij Platform.

---

## Credential Format

```json
{
  "GITHUB": {
    "token": "your-personal-access-token",
    "username": "your-github-username",
    "defaultRepoOwner": "default-repo-owner-if-applicable"
  }
}
```
| Field              | Description                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `token`            | Your GitHub Personal Access Token (PAT) used to authenticate API requests.                   |
| `username`         | Your GitHub username used to associate API actions and identify the user.                    |
| `defaultRepoOwner` | (Optional) The default owner of the repositories (useful for org-wide or fixed repo setups). |
