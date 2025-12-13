import { useEffect } from 'react';
import { versionService } from '../services/versionService';
import { githubService } from '../services/githubService';

// Git commit mesajlarını simüle eden sistem
export function useAutoVersion() {
    useEffect(() => {
        // Sayfa yüklendiğinde son commit'i kontrol et
        checkForNewCommits();
        
        // Her 2 dakikada bir kontrol et (GitHub API rate limit için)
        const interval = setInterval(checkForNewCommits, 2 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    const checkForNewCommits = async () => {
        try {
            // GitHub bağlantısını kontrol et
            const isConnected = await githubService.testConnection();
            if (!isConnected) {
                console.log('🔗 GitHub not connected, skipping commit check');
                return;
            }

            console.log('🔍 Checking for new GitHub commits...');
            
            // Yeni commit'leri kontrol et
            const newCommits = await githubService.checkForNewCommits();
            
            if (newCommits.length === 0) {
                console.log('📝 No new commits found');
                return;
            }

            console.log(`📦 Found ${newCommits.length} new commits`);

            // Her yeni commit için versiyon güncelle
            for (const commit of newCommits.reverse()) { // Eski commit'lerden başla
                const changes = githubService.parseCommitChanges(commit.commit.message);
                const versionType = githubService.getVersionTypeFromCommit(commit.commit.message);
                
                if (changes.length > 0) {
                    const newVersion = versionService.addVersion(changes, versionType);
                    console.log(`🚀 Auto-updated to version ${newVersion} from commit: ${commit.sha.substring(0, 7)}`);
                    
                    // Admin'e bildirim göster
                    if (localStorage.getItem('isAdmin') === 'true') {
                        showVersionUpdateNotification(newVersion, commit.commit.message, commit.html_url);
                    }
                    
                    // Kısa bekleme (çoklu commit'ler için)
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            console.warn('GitHub commit check failed:', error);
        }
    };

    const showVersionUpdateNotification = (version: string, commitMessage: string, commitUrl?: string) => {
        // Toast notification göster
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm animate-in slide-in-from-right-2';
        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="bg-white/20 p-2 rounded-lg">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <div class="flex-1">
                    <div class="font-bold text-sm flex items-center gap-2">
                        Yeni Versiyon: v${version}
                        <span class="bg-green-400 text-green-900 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">YENİ</span>
                    </div>
                    <div class="text-xs text-emerald-100 mt-1 opacity-90">${commitMessage.substring(0, 50)}...</div>
                    <div class="flex items-center justify-between mt-2">
                        <div class="text-xs text-emerald-200">GitHub'dan otomatik</div>
                        ${commitUrl ? `<a href="${commitUrl}" target="_blank" class="text-xs text-white bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors">Commit'i Gör</a>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 5 saniye sonra kaldır
        setTimeout(() => {
            notification.style.animation = 'slide-out-to-right-2 0.3s ease-in forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    };
}

// Manuel versiyon güncelleme fonksiyonu
export function updateVersionManually(changes: string[], type: 'major' | 'minor' | 'patch' = 'patch') {
    const newVersion = versionService.addVersion(changes, type);
    
    // Sayfayı yenile (footer'daki versiyon numarasını güncellemek için)
    window.dispatchEvent(new Event('version-updated'));
    
    return newVersion;
}

// GitHub webhook simülasyonu
export function simulateGitHubWebhook(commitMessage: string) {
    const newVersion = versionService.autoUpdateVersion(commitMessage);
    
    if (newVersion) {
        console.log(`🔄 Webhook triggered version update: ${newVersion}`);
        window.dispatchEvent(new Event('version-updated'));
        return newVersion;
    }
    
    return null;
}