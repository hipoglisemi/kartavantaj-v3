import { useEffect } from 'react';
import { versionService } from '../services/versionService';

// Git commit mesajlarını simüle eden sistem
export function useAutoVersion() {
    useEffect(() => {
        // Sayfa yüklendiğinde son commit'i kontrol et
        checkForNewCommits();
        
        // Her 30 saniyede bir kontrol et (development için)
        const interval = setInterval(checkForNewCommits, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const checkForNewCommits = async () => {
        try {
            // GitHub API'den son commit'i al (eğer GitHub token varsa)
            const githubToken = localStorage.getItem('github_token');
            if (!githubToken) return;

            // Simulated commit check - gerçek uygulamada GitHub API kullanılır
            const lastCheckedCommit = localStorage.getItem('last_checked_commit');
            const currentTime = Date.now();
            const lastCheckTime = parseInt(localStorage.getItem('last_commit_check') || '0');
            
            // 5 dakikada bir kontrol et
            if (currentTime - lastCheckTime < 5 * 60 * 1000) return;
            
            localStorage.setItem('last_commit_check', currentTime.toString());
            
            // Simulated commit messages (gerçek uygulamada GitHub API'den gelir)
            const simulatedCommits = [
                '✨ Modern kampanya yönetimi butonları - 3D gradyan tasarım, tooltip açıklamaları ve animasyonlar',
                '🐛 Dashboard white screen fix - require() usage replaced with ES6 imports',
                '🎨 Admin panel menu reorganization - dropdown system with logical grouping',
                '⚡ Performance improvements for campaign loading',
                '🔒 Security enhancements for admin authentication'
            ];
            
            // Random commit seç (demo için)
            const randomCommit = simulatedCommits[Math.floor(Math.random() * simulatedCommits.length)];
            
            if (lastCheckedCommit !== randomCommit) {
                localStorage.setItem('last_checked_commit', randomCommit);
                
                // Otomatik versiyon güncelle
                const newVersion = versionService.autoUpdateVersion(randomCommit);
                
                if (newVersion) {
                    console.log(`🚀 Auto-updated to version ${newVersion}`);
                    
                    // Admin'e bildirim göster (opsiyonel)
                    if (localStorage.getItem('isAdmin') === 'true') {
                        showVersionUpdateNotification(newVersion, randomCommit);
                    }
                }
            }
        } catch (error) {
            console.warn('Auto version check failed:', error);
        }
    };

    const showVersionUpdateNotification = (version: string, commitMessage: string) => {
        // Toast notification göster
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm animate-in slide-in-from-right-2';
        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="bg-white/20 p-2 rounded-lg">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <div class="flex-1">
                    <div class="font-bold text-sm">Yeni Versiyon: v${version}</div>
                    <div class="text-xs text-indigo-100 mt-1 opacity-90">${commitMessage.substring(0, 60)}...</div>
                    <div class="text-xs text-indigo-200 mt-2">Otomatik güncellendi</div>
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