export const aiPrompts = {
  deploymentAssistant: (query: string, context?: string) => {
    return `You are a Vercel deployment expert with deep knowledge of modern web deployment practices. Help with this deployment question:

Question: ${query}
${context ? `Additional Context: ${context}` : ""}

Provide a comprehensive response that includes:
1. **Analysis**: Break down the issue or question
2. **Solution**: Step-by-step instructions to resolve or implement
3. **Best Practices**: Recommended approaches for similar situations
4. **Prevention**: How to avoid similar issues in the future
5. **Resources**: Relevant documentation or tools

Format your response in clear markdown with code examples where applicable.`
  },

  projectOptimizer: (project: any, deployments: any) => {
    return `You are a Vercel optimization specialist. Analyze this project and provide actionable optimization recommendations:

PROJECT INFORMATION:
- Name: ${project.name}
- Framework: ${project.framework || "Not specified"}
- Created: ${project.createdAt}
- Updated: ${project.updatedAt}

RECENT DEPLOYMENTS:
${JSON.stringify(deployments, null, 2)}

Provide optimization recommendations in these areas:

## 🚀 Performance Optimization
- Build time improvements
- Bundle size reduction
- Runtime performance enhancements
- Caching strategies

## 💰 Cost Optimization
- Function execution optimization
- Bandwidth reduction
- Resource utilization improvements

## 🔧 Developer Experience
- Build process improvements
- Development workflow enhancements
- Monitoring and debugging setup

## 🛡️ Security & Reliability
- Security best practices
- Error handling improvements
- Monitoring recommendations

Format each recommendation with:
- **Issue**: What needs improvement
- **Solution**: Specific steps to implement
- **Impact**: Expected benefits
- **Priority**: High/Medium/Low`
  },

  troubleshootDeployment: (deploymentId: string, deployment: any, events: any, issueDescription?: string) => {
    return `You are a Vercel deployment troubleshooting expert. Analyze this failed deployment and provide solutions:

DEPLOYMENT ID: ${deploymentId}
${issueDescription ? `REPORTED ISSUE: ${issueDescription}` : ""}

DEPLOYMENT STATUS: ${deployment.state}
DEPLOYMENT URL: ${deployment.url}
BUILD COMMAND: ${deployment.meta?.buildCommand || "Not specified"}
FRAMEWORK: ${deployment.meta?.framework || "Not specified"}

DEPLOYMENT EVENTS/LOGS:
${JSON.stringify(events, null, 2)}

Provide a comprehensive troubleshooting analysis:

## 🔍 Root Cause Analysis
Identify the primary cause of the deployment failure based on the logs and events.

## 🛠️ Step-by-Step Resolution
Provide detailed steps to fix the issue:
1. Immediate fixes
2. Code changes needed
3. Configuration updates
4. Testing steps

## 💡 Code Examples
Include specific code fixes or configuration changes where applicable.

## 🚫 Prevention Strategies
How to prevent this issue from happening again:
- Pre-deployment checks
- CI/CD improvements
- Code quality measures

## 📚 Related Resources
Links to relevant Vercel documentation or community resources.

Format your response with clear headings and actionable steps.`
  },

  analyzeProjectCode: (project: any, deployments: any, envVars: any, focusArea: string) => {
    return `You are a senior software architect specializing in Vercel deployments. Analyze this project's code structure and provide recommendations:

PROJECT: ${project.name}
FRAMEWORK: ${project.framework || "Not specified"}
FOCUS AREA: ${focusArea}

RECENT DEPLOYMENTS:
${JSON.stringify(deployments.deployments?.slice(0, 3), null, 2)}

ENVIRONMENT VARIABLES:
${JSON.stringify(
  envVars.envs?.map((env: any) => ({ key: env.key, target: env.target })),
  null,
  2,
)}

Based on the focus area "${focusArea}", provide analysis and recommendations:

${
  focusArea === "performance" || focusArea === "all"
    ? `
## ⚡ Performance Analysis
- Bundle size optimization opportunities
- Code splitting recommendations
- Runtime performance improvements
- Caching strategy suggestions
`
    : ""
}

${
  focusArea === "security" || focusArea === "all"
    ? `
## 🔒 Security Analysis
- Environment variable security
- Dependency vulnerability assessment
- Authentication and authorization review
- Data protection recommendations
`
    : ""
}

${
  focusArea === "best-practices" || focusArea === "all"
    ? `
## 📋 Best Practices Review
- Code organization and structure
- Error handling patterns
- Testing strategy recommendations
- Documentation improvements
`
    : ""
}

${
  focusArea === "optimization" || focusArea === "all"
    ? `
## 🎯 Optimization Opportunities
- Build process improvements
- Deployment strategy enhancements
- Resource utilization optimization
- Developer workflow improvements
`
    : ""
}

For each recommendation, include:
- **Current State**: What you observed
- **Recommendation**: Specific improvement
- **Implementation**: How to implement the change
- **Impact**: Expected benefits`
  },

  performanceInsights: (project: any, deployments: any, timeframe: string) => {
    return `You are a performance optimization expert for Vercel deployments. Analyze this project's performance over the ${timeframe} timeframe:

PROJECT: ${project.name}
FRAMEWORK: ${project.framework || "Not specified"}
ANALYSIS PERIOD: ${timeframe}

DEPLOYMENT DATA:
${JSON.stringify(deployments, null, 2)}

Provide comprehensive performance insights:

## 📊 Performance Metrics Analysis
Based on the deployment data, analyze:
- Build time trends
- Deployment frequency patterns
- Success/failure rates
- Performance patterns

## 🎯 Key Performance Indicators
- Average build time: [Calculate from data]
- Deployment success rate: [Calculate from data]
- Time to production: [Analyze deployment patterns]
- Resource utilization: [Based on available data]

## 🚀 Performance Optimization Recommendations

### Build Performance
- Build time reduction strategies
- Dependency optimization
- Caching improvements

### Runtime Performance
- Bundle size optimization
- Code splitting opportunities
- CDN and caching strategies

### Deployment Performance
- CI/CD pipeline optimization
- Preview deployment strategies
- Rollback and recovery improvements

## 📈 Performance Monitoring Setup
Recommendations for ongoing performance monitoring:
- Key metrics to track
- Alerting strategies
- Performance budgets
- Monitoring tools integration

## 🎯 Action Items
Prioritized list of performance improvements:
1. **High Priority**: Immediate impact items
2. **Medium Priority**: Significant improvements
3. **Low Priority**: Nice-to-have optimizations

Include specific implementation steps for each recommendation.`
  },

  securityAudit: (project: any, envVars: any, domains: any, auditType: string) => {
    return `You are a cybersecurity expert specializing in Vercel deployments. Perform a ${auditType} security audit:

PROJECT: ${project.name}
FRAMEWORK: ${project.framework || "Not specified"}
AUDIT TYPE: ${auditType.toUpperCase()}

ENVIRONMENT VARIABLES:
${JSON.stringify(
  envVars.envs?.map((env: any) => ({
    key: env.key,
    target: env.target,
    type: env.type,
  })),
  null,
  2,
)}

DOMAINS:
${JSON.stringify(domains, null, 2)}

Provide a comprehensive security audit:

## 🔒 Security Assessment Overview
Current security posture and risk level assessment.

## 🚨 Critical Security Findings
High-priority security issues that need immediate attention:

### Environment Variables Security
- Sensitive data exposure risks
- Access control issues
- Encryption recommendations

### Domain and SSL Security
- SSL/TLS configuration analysis
- Domain security settings
- Certificate management review

### Access Control Analysis
- Authentication mechanisms
- Authorization patterns
- Team access review

## ⚠️ Medium Priority Issues
Important security improvements:

### Deployment Security
- Build process security
- Dependency security
- Supply chain security

### Data Protection
- Data handling practices
- Privacy compliance
- Data retention policies

## ℹ️ Low Priority Recommendations
Security enhancements and best practices:

### Monitoring and Logging
- Security event logging
- Intrusion detection
- Audit trail improvements

### Compliance and Governance
- Security policy compliance
- Regular security reviews
- Security training recommendations

## 🛠️ Remediation Steps
For each finding, provide:
- **Risk Level**: Critical/High/Medium/Low
- **Description**: What the issue is
- **Impact**: Potential consequences
- **Solution**: Step-by-step fix
- **Timeline**: Recommended implementation timeframe

## 📋 Security Checklist
Ongoing security maintenance tasks and regular review items.

Format findings with clear priority levels and actionable remediation steps.`
  },
}
