// Console koruması - Production'da console erişimini engeller
export class ConsoleProtection {
    private static isProtected = false;
    
    static enable(): void {
        if (this.isProtected || process.env.NODE_ENV === 'development') return;
        
        try {
            // Console metodlarını devre dışı bırak
            const noop = () => {};
            
            // Ana console metodları
            console.log = noop;
            console.warn = noop;
            console.error = noop;
            console.info = noop;
            console.debug = noop;
            console.trace = noop;
            console.dir = noop;
            console.dirxml = noop;
            console.group = noop;
            console.groupEnd = noop;
            console.time = noop;
            console.timeEnd = noop;
            console.assert = noop;
            console.profile = noop;
            console.profileEnd = noop;
            
            // DevTools açılma tespiti
            let devtools = { open: false, orientation: null };
            const threshold = 160;
            
            setInterval(() => {
                if (window.outerHeight - window.innerHeight > threshold || 
                    window.outerWidth - window.innerWidth > threshold) {
                    if (!devtools.open) {
                        devtools.open = true;
                        this.handleDevToolsOpen();
                    }
                } else {
                    devtools.open = false;
                }
            }, 500);
            
            // Sağ tık koruması
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showWarning();
            });
            
            // F12 koruması
            document.addEventListener('keydown', (e) => {
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                    (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                    (e.ctrlKey && e.key === 'U')) {
                    e.preventDefault();
                    this.showWarning();
                }
            });
            
            this.isProtected = true;
        } catch {
            // Sessizce başarısız ol
        }
    }
    
    private static handleDevToolsOpen(): void {
        try {
            // DevTools açıldığında uyarı
            document.body.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #000;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: Arial, sans-serif;
                    z-index: 999999;
                ">
                    <div style="text-align: center;">
                        <h1>⚠️ Güvenlik Uyarısı</h1>
                        <p>Bu sayfa güvenlik nedeniyle korunmaktadır.</p>
                        <p>Geliştirici araçları kullanımı tespit edildi.</p>
                        <button onclick="window.location.reload()" style="
                            background: #dc2626;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            margin-top: 20px;
                        ">Sayfayı Yenile</button>
                    </div>
                </div>
            `;
        } catch {
            // Sessizce başarısız ol
        }
    }
    
    private static showWarning(): void {
        try {
            alert('⚠️ Bu işlem güvenlik nedeniyle engellenmiştir.');
        } catch {
            // Sessizce başarısız ol
        }
    }
    
    // Güvenlik mesajı göster
    static showSecurityMessage(): void {
        try {
            if (process.env.NODE_ENV === 'production') {
                console.clear();
                console.log('%c🔒 GÜVENLIK UYARISI', 'color: red; font-size: 20px; font-weight: bold;');
                console.log('%cBu konsol geliştiriciler içindir. Bilinmeyen kodları buraya yapıştırmayın!', 'color: red; font-size: 14px;');
                console.log('%cKötü niyetli kişiler bu konsolu kullanarak hesabınızı ele geçirebilir.', 'color: red; font-size: 14px;');
            }
        } catch {
            // Sessizce başarısız ol
        }
    }
}

export default ConsoleProtection;