interface GitHubCommit {
    sha: string;
    commit: {
        message: string;
        author: {
            name: string;
            email: string;
            date: string;
        };
    };
    html_url: string;
}

interface GitHubRepo {
    owner: string;
    repo: string;
}

class GitHubService {
    private baseUrl = 'https://api.github.com';
    private lastCheckedCommit = 'github_last_commit_sha';
    private lastCheckTime = 'github_last_check_time';

    // GitHub repo bilgilerini al
    getRepoInfo(): GitHubRepo | null {
        const integrations = localStorage.getItem('adminIntegrations');
        if (!integrations) return null;

        try {
            const configs = JSON.parse(integrations);
            const githubConfig = configs.github;
            
            if (!githubConfig?.repo || !githubConfig?.token) return null;

            const [owner, repo] = githubConfig.repo.split('/');
            return { owner, repo };
        } catch {
            return null;
        }
    }

    // GitHub token'ı al
    getToken(): string | null {
        const integrations = localStorage.getItem('adminIntegrations');
        if (!integrations) return null;

        try {
            const configs = JSON.parse(integrations);
            return configs.github?.token || null;
        } catch {
            return null;
        }
    }

    // Son commit'leri al
    async getLatestCommits(limit: number = 10): Promise<GitHubCommit[]> {
        const repoInfo = this.getRepoInfo();
        const token = this.getToken();

        if (!repoInfo || !token) {
            throw new Error('GitHub configuration not found');
        }

        const url = `${this.baseUrl}/repos/${repoInfo.owner}/${repoInfo.repo}/commits?per_page=${limit}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'KartAvantaj-Admin'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Yeni commit'leri kontrol et
    async checkForNewCommits(): Promise<GitHubCommit[]> {
        try {
            const commits = await this.getLatestCommits(5);
            if (commits.length === 0) return [];

            const lastCheckedSha = localStorage.getItem(this.lastCheckedCommit);
            const latestCommit = commits[0];

            // İlk kez kontrol ediyorsak, sadece son commit'i kaydet
            if (!lastCheckedSha) {
                localStorage.setItem(this.lastCheckedCommit, latestCommit.sha);
                localStorage.setItem(this.lastCheckTime, Date.now().toString());
                return [];
            }

            // Yeni commit'leri bul
            const newCommits: GitHubCommit[] = [];
            for (const commit of commits) {
                if (commit.sha === lastCheckedSha) break;
                newCommits.push(commit);
            }

            // Son kontrol edilen commit'i güncelle
            if (newCommits.length > 0) {
                localStorage.setItem(this.lastCheckedCommit, latestCommit.sha);
                localStorage.setItem(this.lastCheckTime, Date.now().toString());
            }

            return newCommits;
        } catch (error) {
            console.warn('GitHub commit check failed:', error);
            return [];
        }
    }

    // Commit mesajından versiyon tipini belirle
    getVersionTypeFromCommit(message: string): 'major' | 'minor' | 'patch' {
        const lowerMessage = message.toLowerCase();
        
        // Major version indicators
        if (lowerMessage.includes('breaking') || 
            lowerMessage.includes('major') ||
            lowerMessage.includes('!:')) {
            return 'major';
        }
        
        // Minor version indicators
        if (lowerMessage.includes('feat') || 
            lowerMessage.includes('✨') ||
            lowerMessage.includes('minor') ||
            lowerMessage.includes('add') ||
            lowerMessage.includes('new')) {
            return 'minor';
        }
        
        // Default to patch
        return 'patch';
    }

    // Commit mesajını temizle ve değişiklikleri çıkar
    parseCommitChanges(message: string): string[] {
        // Commit mesajını satırlara böl
        const lines = message.split('\n').filter(line => line.trim().length > 0);
        const changes: string[] = [];
        
        // İlk satır (başlık) her zaman eklenir
        if (lines[0]) {
            let title = lines[0].trim();
            
            // Emoji'leri kaldır ama anlamlarını koru
            title = title.replace(/✨/g, '').replace(/🐛/g, '').replace(/🎨/g, '').replace(/⚡/g, '').replace(/🔒/g, '').trim();
            
            // Conventional commit formatını temizle
            title = title.replace(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*/i, '');
            
            if (title.length > 0) {
                changes.push(title);
            }
        }
        
        // Diğer satırları da ekle (eğer bullet point formatındaysa)
        for (let i = 1; i < lines.length && i < 5; i++) {
            const line = lines[i].trim();
            if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
                const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
                if (cleanLine.length > 0 && cleanLine.length < 100) {
                    changes.push(cleanLine);
                }
            }
        }
        
        return changes.slice(0, 3); // Maksimum 3 değişiklik
    }

    // Son kontrol zamanını al
    getLastCheckTime(): Date | null {
        const timestamp = localStorage.getItem(this.lastCheckTime);
        return timestamp ? new Date(parseInt(timestamp)) : null;
    }

    // GitHub bağlantısını test et
    async testConnection(): Promise<boolean> {
        try {
            const repoInfo = this.getRepoInfo();
            const token = this.getToken();

            if (!repoInfo || !token) return false;

            const url = `${this.baseUrl}/repos/${repoInfo.owner}/${repoInfo.repo}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'KartAvantaj-Admin'
                }
            });

            return response.ok;
        } catch {
            return false;
        }
    }
}

export const githubService = new GitHubService();
export type { GitHubCommit, GitHubRepo };