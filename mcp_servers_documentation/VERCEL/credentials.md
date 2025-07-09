# Vercel MCP Server Credentials Configuration

## Required Credentials

### 1. Vercel API Token

**Environment Variable**: \`VERCEL_TOKEN\`

#### How to Obtain:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Settings → Tokens
3. Click "Create Token"
4. Choose appropriate scope (recommended: Full Access for MCP server)
5. Set expiration date (optional but recommended)
6. Copy the generated token

#### Token Scopes:

- **Full Access**: Complete API access (recommended for MCP server)
- **Read Only**: Limited to read operations
- **Custom**: Specific permission sets

#### Security Best Practices:

- Store token securely in environment variables
- Use token expiration dates
- Rotate tokens regularly
- Monitor token usage in Vercel dashboard

### 2. Google Gemini API Key

**Environment Variable**: \`GEMINI_API_KEY\`

#### How to Obtain:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Choose your Google Cloud project
5. Copy the generated API key

#### Alternative Method (Google Cloud Console):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Generative AI API
3. Navigate to APIs & Services → Credentials
4. Click "Create Credentials" → "API Key"
5. Restrict the key to Generative AI API (recommended)

#### Security Considerations:

- Restrict API key to specific APIs
- Set up usage quotas
- Monitor API usage and costs
- Store securely in environment variables

### 3. Team ID (Optional)

**Environment Variable**: \`TEAM_ID\`

#### How to Obtain:

1. Go to your Vercel team dashboard
2. The team ID is visible in the URL: \`vercel.com/teams/[TEAM_ID]\`
3. Or use the Vercel CLI: \`vercel teams list\`

#### Usage:

- Used as default team for operations when not specified
- Can be overridden per operation
- Useful for team-scoped MCP servers

## Environment Configuration

### Development Setup

Create a \`.env.local\` file in your project root:

```bash
VERCEL_TOKEN=your_vercel_token_here
GEMINI_API_KEY=your_gemini_api_key_here
TEAM_ID=your_team_id_here
```

### Production Deployment

#### Vercel Deployment:

1. Add environment variables in Vercel dashboard
2. Go to Project Settings → Environment Variables
3. Add each variable with appropriate target environments

## Credential Validation

The MCP server includes built-in credential validation:

### Startup Validation:

- Checks for required environment variables
- Validates token format
- Tests API connectivity
- Reports configuration issues

### Runtime Validation:

- Monitors token expiration
- Handles authentication errors
- Provides clear error messages
- Suggests remediation steps

## Security Best Practices

### Token Management:

1. **Never commit tokens to version control**
2. **Use environment variables exclusively**
3. **Implement token rotation procedures**
4. **Monitor token usage and access logs**
5. **Use least-privilege access principles**

### API Key Security:

1. **Restrict API keys to necessary services**
2. **Set up usage quotas and alerts**
3. **Monitor API usage patterns**
4. **Implement key rotation schedules**
5. **Use separate keys for different environments**

### Access Control:

1. **Use team-specific tokens when possible**
2. **Implement role-based access control**
3. **Regular access reviews and audits**
4. **Monitor and log all API operations**
5. **Implement IP restrictions where applicable**

## Troubleshooting

### Common Issues:

#### Invalid Vercel Token:

- **Error**: "Authentication failed"
- **Solution**: Verify token is correct and not expired
- **Check**: Token permissions and scope

#### Invalid Gemini API Key:

- **Error**: "API key not valid"
- **Solution**: Verify key is correct and API is enabled
- **Check**: Usage quotas and billing status

#### Team Access Issues:

- **Error**: "Team not found" or "Access denied"
- **Solution**: Verify team ID and token permissions
- **Check**: Team membership and role permissions

### Validation Commands:

Test Vercel token:

```bash
curl -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v2/user
```

Test Gemini API key:

```bash
curl -H "x-goog-api-key: $GEMINI_API_KEY" https://generativelanguage.googleapis.com/v1/models
```

## Credential Rotation

### Automated Rotation:

1. Set up monitoring for token expiration
2. Implement automated token refresh
3. Use secret management systems
4. Configure alerts for rotation events

### Manual Rotation Process:

1. Generate new credentials
2. Update environment variables
3. Test connectivity
4. Revoke old credentials
5. Update documentation

## Compliance Considerations

### Data Protection:

- Ensure credentials are encrypted at rest
- Use secure transmission protocols
- Implement access logging
- Regular security audits

### Regulatory Compliance:

- Follow organizational security policies
- Implement required access controls
- Maintain audit trails
- Regular compliance reviews

## Support and Resources

### Documentation:

- [Vercel API Documentation](https://vercel.com/docs/rest-api)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [MCP Specification](https://modelcontextprotocol.io/)

### Support Channels:

- Vercel Support: [vercel.com/help](https://vercel.com/help)
- Google AI Support: [Google Cloud Support](https://cloud.google.com/support)
- MCP Community: [GitHub Discussions](https://github.com/modelcontextprotocol/specification/discussions)
