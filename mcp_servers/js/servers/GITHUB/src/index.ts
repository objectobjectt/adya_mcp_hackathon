import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import morgan from 'morgan';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const GITHUB_TOKEN =  process.env.GITHUB_TOKEN || '';
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

app.use(express.json());
app.use(morgan('combined')); // Request logging middleware

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Middleware to check if token exists
const authenticateRequest = (req: Request, res: Response, next: NextFunction): void => {
    if (!GITHUB_TOKEN) {
        res.status(500).json({ error: 'GitHub API token not configured' });
        return;
    }
    next();
};

// Cache middleware for GET requests
const cacheMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'POST') {
        const key = `${req.path}_${JSON.stringify(req.body)}`;
        const cachedResponse = cache.get(key);
        if (cachedResponse) {
            res.json(cachedResponse);
            return;
        }
        res.locals.cacheKey = key;
    }
    next();
};

// Error handling middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
};

// Validation middleware for repository-related endpoints
const repoValidation = [
    body('owner').trim().notEmpty().withMessage('Owner is required'),
    body('repo').trim().notEmpty().withMessage('Repository is required')
];

// Validation middleware for issue creation
const issueValidation = [
    ...repoValidation,
    body('title').trim().notEmpty().withMessage('Issue title is required'),
    body('body').trim().optional()
];

// 1. Get repository details
app.post('/getRepo', authenticateRequest, cacheMiddleware, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github+json'
            }
        });

        const { name, description, stargazers_count, forks_count, created_at, updated_at } = response.data;
        const result = { name, description, stars: stargazers_count, forks: forks_count, created_at, updated_at };
        cache.set(res.locals.cacheKey, result);
        res.json(result);
    } catch (error: any) {
        throw new Error(`Failed to fetch repository: ${error.message}`);
    }
});

// 2. Create a GitHub issue
app.post('/createIssue', authenticateRequest, issueValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo, title, body } = req.body;

    try {
        const response = await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/issues`,
            { title, body },
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        res.json({
            issueNumber: response.data.number,
            url: response.data.html_url,
            created_at: response.data.created_at
        });
    } catch (error: any) {
        throw new Error(`Failed to create issue: ${error.message}`);
    }
});

// 3. List pull requests
app.post('/listPullRequests', authenticateRequest, cacheMiddleware, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/pulls`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const pullRequests = response.data.map((pr: any) => ({
            title: pr.title,
            number: pr.number,
            url: pr.html_url,
            user: pr.user.login,
            created_at: pr.created_at,
            state: pr.state
        }));
        cache.set(res.locals.cacheKey, pullRequests);
        res.json(pullRequests);
    } catch (error: any) {
        throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
});

// 4. Get repository contributors
app.post('/getContributors', authenticateRequest, cacheMiddleware, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contributors`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const contributors = response.data.map((contributor: any) => ({
            username: contributor.login,
            contributions: contributor.contributions,
            avatar_url: contributor.avatar_url
        }));
        cache.set(res.locals.cacheKey, contributors);
        res.json(contributors);
    } catch (error: any) {
        throw new Error(`Failed to fetch contributors: ${error.message}`);
    }
});

// 5. Create a new repository
app.post('/createRepo', authenticateRequest, [
    body('name').trim().notEmpty().withMessage('Repository name is required'),
    body('description').trim().optional(),
    body('private').isBoolean().optional()
], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { name, description, private: isPrivate } = req.body;

    try {
        const response = await axios.post(
            `https://api.github.com/user/repos`,
            {
                name,
                description,
                private: isPrivate || false
            },
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        res.json({
            name: response.data.name,
            url: response.data.html_url,
            created_at: response.data.created_at
        });
    } catch (error: any) {
        throw new Error(`Failed to create repository: ${error.message}`);
    }
});

// 6. Update issue status
app.patch('/updateIssue', authenticateRequest, [
    ...repoValidation,
    body('issueNumber').isInt().withMessage('Issue number must be an integer'),
    body('state').isIn(['open', 'closed']).withMessage('State must be either open or closed')
], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo, issueNumber, state } = req.body;

    try {
        const response = await axios.patch(
            `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
            { state },
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        res.json({
            issueNumber: response.data.number,
            state: response.data.state,
            updated_at: response.data.updated_at
        });
    } catch (error: any) {
        throw new Error(`Failed to update issue: ${error.message}`);
    }
});

// 7. Get repository branches
app.post('/getBranches', authenticateRequest, cacheMiddleware, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/branches`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const branches = response.data.map((branch: any) => ({
            name: branch.name,
            commit_sha: branch.commit.sha,
            protected: branch.protected
        }));
        cache.set(res.locals.cacheKey, branches);
        res.json(branches);
    } catch (error: any) {
        throw new Error(`Failed to fetch branches: ${error.message}`);
    }
});

// 8. Get repository issues
app.post('/getIssues', authenticateRequest, cacheMiddleware, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/issues`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const issues = response.data.map((issue: any) => ({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            created_at: issue.created_at,
            user: issue.user.login
        }));
        cache.set(res.locals.cacheKey, issues);
        res.json(issues);
    } catch (error: any) {
        throw new Error(`Failed to fetch issues: ${error.message}`);
    }
});

// 9. Get specific issue details
app.post('/getIssue', authenticateRequest, cacheMiddleware, [
    ...repoValidation,
    body('issueNumber').isInt().withMessage('Issue number must be an integer')
], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo, issueNumber } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const issue = {
            number: response.data.number,
            title: response.data.title,
            body: response.data.body,
            state: response.data.state,
            created_at: response.data.created_at,
            user: response.data.user.login
        };
        cache.set(res.locals.cacheKey, issue);
        res.json(issue);
    } catch (error: any) {
        throw new Error(`Failed to fetch issue: ${error.message}`);
    }
});

// 10. Add comment to issue
app.post('/addIssueComment', authenticateRequest, [
    ...repoValidation,
    body('issueNumber').isInt().withMessage('Issue number must be an integer'),
    body('comment').trim().notEmpty().withMessage('Comment is required')
], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo, issueNumber, comment } = req.body;

    try {
        const response = await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
            { body: comment },
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        res.json({
            id: response.data.id,
            url: response.data.html_url,
            created_at: response.data.created_at
        });
    } catch (error: any) {
        throw new Error(`Failed to add comment: ${error.message}`);
    }
});

// 11. List repository commits
app.post('/listCommits', authenticateRequest, cacheMiddleware, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/commits`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const commits = response.data.map((commit: any) => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: commit.commit.author.date
        }));
        cache.set(res.locals.cacheKey, commits);
        res.json(commits);
    } catch (error: any) {
        throw new Error(`Failed to fetch commits: ${error.message}`);
    }
});

// 12. Get specific commit details
app.post('/getCommit', authenticateRequest, cacheMiddleware, [
    ...repoValidation,
    body('sha').trim().notEmpty().withMessage('Commit SHA is required')
], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo, sha } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const commit = {
            sha: response.data.sha,
            message: response.data.commit.message,
            author: response.data.commit.author.name,
            date: response.data.commit.author.date,
            files: response.data.files.map((file: any) => ({
                filename: file.filename,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions
            }))
        };
        cache.set(res.locals.cacheKey, commit);
        res.json(commit);
    } catch (error: any) {
        throw new Error(`Failed to fetch commit: ${error.message}`);
    }
});

// 13. Create new branch
app.post('/createBranch', authenticateRequest, [
    ...repoValidation,
    body('branchName').trim().notEmpty().withMessage('Branch name is required'),
    body('sha').trim().notEmpty().withMessage('Source commit SHA is required')
], async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo, branchName, sha } = req.body;

    try {
        const response = await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/git/refs`,
            {
                ref: `refs/heads/${branchName}`,
                sha
            },
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        res.json({
            ref: response.data.ref,
            url: response.data.url
        });
    } catch (error: any) {
        throw new Error(`Failed to create branch: ${error.message}`);
    }
});

// 14. Delete repository
app.delete('/deleteRepo', authenticateRequest, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        await axios.delete(
            `https://api.github.com/repos/${owner}/${repo}`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        res.json({ message: `Repository ${owner}/${repo} deleted successfully` });
    } catch (error: any) {
        throw new Error(`Failed to delete repository: ${error.message}`);
    }
});

// 15. List repository tags
app.post('/listTags', authenticateRequest, cacheMiddleware, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/tags`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const tags = response.data.map((tag: any) => ({
            name: tag.name,
            commit_sha: tag.commit.sha,
            zipball_url: tag.zipball_url
        }));
        cache.set(res.locals.cacheKey, tags);
        res.json(tags);
    } catch (error: any) {
        throw new Error(`Failed to fetch tags: ${error.message}`);
    }
});

// 16. Get repository languages
app.post('/getLanguages', authenticateRequest, cacheMiddleware, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/languages`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        cache.set(res.locals.cacheKey, response.data);
        res.json(response.data);
    } catch (error: any) {
        throw new Error(`Failed to fetch languages: ${error.message}`);
    }
});

// 17. Star a repository
app.put('/starRepo', authenticateRequest, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        await axios.put(
            `https://api.github.com/user/starred/${owner}/${repo}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        res.json({ message: `Successfully starred ${owner}/${repo}` });
    } catch (error: any) {
        throw new Error(`Failed to star repository: ${error.message}`);
    }
});

// 18. Unstar a repository
app.delete('/unstarRepo', authenticateRequest, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        await axios.delete(
            `https://api.github.com/user/starred/${owner}/${repo}`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        res.json({ message: `Successfully unstarred ${owner}/${repo}` });
    } catch (error: any) {
        throw new Error(`Failed to unstar repository: ${error.message}`);
    }
});

// 19. List repository watchers
app.post('/listWatchers', authenticateRequest, cacheMiddleware, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/subscribers`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const watchers = response.data.map((watcher: any) => ({
            username: watcher.login,
            avatar_url: watcher.avatar_url
        }));
        cache.set(res.locals.cacheKey, watchers);
        res.json(watchers);
    } catch (error: any) {
        throw new Error(`Failed to fetch watchers: ${error.message}`);
    }
});

// 20. Get repository readme
app.post('/getReadme', authenticateRequest, cacheMiddleware, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/readme`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const readme = {
            name: response.data.name,
            path: response.data.path,
            content: Buffer.from(response.data.content, 'base64').toString('utf-8'),
            download_url: response.data.download_url
        };
        cache.set(res.locals.cacheKey, readme);
        res.json(readme);
    } catch (error: any) {
        throw new Error(`Failed to fetch readme: ${error.message}`);
    }
});

// 21. Create repository fork
app.post('/createFork', authenticateRequest, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/forks`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        res.json({
            name: response.data.name,
            url: response.data.html_url,
            created_at: response.data.created_at
        });
    } catch (error: any) {
        throw new Error(`Failed to create fork: ${error.message}`);
    }
});

// 22. List repository webhooks
app.post('/listWebhooks', authenticateRequest, cacheMiddleware, repoValidation, async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { owner, repo } = req.body;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/hooks`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const webhooks = response.data.map((hook: any) => ({
            id: hook.id,
            name: hook.name,
            active: hook.active,
            events: hook.events,
            url: hook.config.url
        }));
        cache.set(res.locals.cacheKey, webhooks);
        res.json(webhooks);
    } catch (error: any) {
        throw new Error(`Failed to fetch webhooks: ${error.message}`);
    }
});

// Apply error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`✅ GitHub MCP server is running on http://localhost:${PORT}`);
});