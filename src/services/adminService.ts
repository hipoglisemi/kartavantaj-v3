import { supabase } from './authService';
import SecurityService from './securityService';
import TOTPService from './totpService';

export interface AdminUser {
    id?: string;
    email: string;
    name: string;
    status: 'pending' | 'active' | 'rejected';
    totp_secret?: string;
    password_hash?: string;
    created_at?: string;
    approved_at?: string;
    approved_by?: string;
    last_login?: string;
}

export class AdminService {
    // Admin oluştur (Supabase'e kaydet)
    static async createAdmin(adminData: {
        email: string;
        name: string;
        password: string;
        totpSecret: string;
    }): Promise<boolean> {
        if (!supabase) {
            console.error('Supabase connection not available');
            return false;
        }

        try {
            // Şifreyi hash'le (basit XOR encryption)
            const passwordHash = SecurityService.encrypt(adminData.password);
            
            const { error } = await supabase
                .from('admin_users')
                .insert({
                    email: adminData.email,
                    name: adminData.name,
                    status: 'pending',
                    totp_secret: SecurityService.encrypt(adminData.totpSecret),
                    password_hash: passwordHash
                });

            if (error) {
                console.error('Admin creation error:', error);
                return false;
            }

            // Backward compatibility - localStorage'a da kaydet
            this.syncToLocalStorage();
            
            return true;
        } catch (error) {
            console.error('Admin creation failed:', error);
            return false;
        }
    }

    // Tüm adminleri getir
    static async getAllAdmins(): Promise<AdminUser[]> {
        if (!supabase) {
            // Fallback to localStorage
            return this.getLocalAdmins();
        }

        try {
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch admins:', error);
                return this.getLocalAdmins();
            }

            return data || [];
        } catch (error) {
            console.error('Admin fetch failed:', error);
            return this.getLocalAdmins();
        }
    }

    // Admin durumunu güncelle (onay/red)
    static async updateAdminStatus(
        email: string, 
        status: 'active' | 'rejected', 
        approvedBy: string
    ): Promise<boolean> {
        if (!supabase) return false;

        try {
            const { error } = await supabase
                .from('admin_users')
                .update({
                    status,
                    approved_by: approvedBy,
                    approved_at: new Date().toISOString()
                })
                .eq('email', email);

            if (error) {
                console.error('Admin status update error:', error);
                return false;
            }

            // localStorage'ı da güncelle
            this.syncToLocalStorage();
            return true;
        } catch (error) {
            console.error('Admin status update failed:', error);
            return false;
        }
    }

    // Admin sil
    static async deleteAdmin(email: string): Promise<boolean> {
        if (!supabase) return false;

        try {
            const { error } = await supabase
                .from('admin_users')
                .delete()
                .eq('email', email);

            if (error) {
                console.error('Admin deletion error:', error);
                return false;
            }

            // localStorage'ı da güncelle
            this.syncToLocalStorage();
            return true;
        } catch (error) {
            console.error('Admin deletion failed:', error);
            return false;
        }
    }

    // Admin giriş doğrulama
    static async verifyAdminLogin(email: string, password: string): Promise<AdminUser | null> {
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .eq('status', 'active')
                .single();

            if (error || !data) {
                return null;
            }

            // Şifre kontrolü
            const decryptedPassword = SecurityService.decrypt(data.password_hash || '');
            if (decryptedPassword !== password) {
                return null;
            }

            // Son giriş zamanını güncelle
            await supabase
                .from('admin_users')
                .update({ last_login: new Date().toISOString() })
                .eq('email', email);

            return data;
        } catch (error) {
            console.error('Admin login verification failed:', error);
            return null;
        }
    }

    // TOTP secret'ını getir
    static async getAdminTOTPSecret(email: string): Promise<string | null> {
        if (!supabase) {
            // Fallback to localStorage
            return TOTPService.getAdminSecret(email);
        }

        try {
            const { data, error } = await supabase
                .from('admin_users')
                .select('totp_secret')
                .eq('email', email)
                .single();

            if (error || !data?.totp_secret) {
                return TOTPService.getAdminSecret(email); // Fallback
            }

            return SecurityService.decrypt(data.totp_secret);
        } catch (error) {
            console.error('TOTP secret fetch failed:', error);
            return TOTPService.getAdminSecret(email); // Fallback
        }
    }

    // TOTP secret'ını güncelle
    static async updateAdminTOTPSecret(email: string, secret: string): Promise<boolean> {
        if (!supabase) {
            // Fallback to localStorage
            TOTPService.saveAdminSecret(email, secret);
            return true;
        }

        try {
            const { error } = await supabase
                .from('admin_users')
                .update({ totp_secret: SecurityService.encrypt(secret) })
                .eq('email', email);

            if (error) {
                console.error('TOTP secret update error:', error);
                // Fallback to localStorage
                TOTPService.saveAdminSecret(email, secret);
                return false;
            }

            // localStorage'a da kaydet (backward compatibility)
            TOTPService.saveAdminSecret(email, secret);
            return true;
        } catch (error) {
            console.error('TOTP secret update failed:', error);
            TOTPService.saveAdminSecret(email, secret);
            return false;
        }
    }

    // Backward compatibility - localStorage'dan adminleri getir
    private static getLocalAdmins(): AdminUser[] {
        try {
            const stored = localStorage.getItem('site_settings');
            if (!stored) return [];
            
            const settings = JSON.parse(stored);
            const admins = settings.admins || [];
            
            return admins.map((admin: any) => ({
                email: typeof admin === 'string' ? admin : admin.email,
                name: typeof admin === 'string' ? 'Admin' : admin.name,
                status: typeof admin === 'string' ? 'active' : admin.status,
                created_at: typeof admin === 'string' ? new Date().toISOString() : admin.createdAt
            }));
        } catch {
            return [];
        }
    }

    // Supabase'den localStorage'a senkronize et
    private static async syncToLocalStorage(): Promise<void> {
        try {
            const admins = await this.getAllAdmins();
            const stored = localStorage.getItem('site_settings');
            const settings = stored ? JSON.parse(stored) : {};
            
            // Admin listesini güncelle
            settings.admins = admins.map(admin => ({
                email: admin.email,
                name: admin.name,
                status: admin.status,
                createdAt: admin.created_at,
                approvedBy: admin.approved_by,
                approvedAt: admin.approved_at
            }));
            
            localStorage.setItem('site_settings', JSON.stringify(settings));
            window.dispatchEvent(new Event('site-settings-changed'));
        } catch (error) {
            console.error('Sync to localStorage failed:', error);
        }
    }

    // Gerçek zamanlı admin değişikliklerini dinle
    static subscribeToAdminChanges(callback: (admins: AdminUser[]) => void) {
        if (!supabase) return null;
        
        const subscription = supabase
            .channel('admin_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'admin_users' },
                async () => {
                    console.log('🔔 Admin değişiklikleri algılandı');
                    const admins = await this.getAllAdmins();
                    callback(admins);
                    this.syncToLocalStorage();
                }
            )
            .subscribe();
            
        return subscription;
    }
}

export default AdminService;