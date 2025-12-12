import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import SecurityService from '../services/securityService';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkAuthorization = () => {
            try {
                if (requireAdmin) {
                    // Admin yetkisi gerekli
                    const isValidSession = SecurityService.isValidAdminSession();
                    const isAdmin = localStorage.getItem('isAdmin') === 'true';
                    
                    if (!isValidSession || !isAdmin) {
                        SecurityService.logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', {
                            path: location.pathname,
                            userAgent: navigator.userAgent
                        });
                        SecurityService.destroyAdminSession();
                        setIsAuthorized(false);
                    } else {
                        setIsAuthorized(true);
                    }
                } else {
                    // Normal kullanıcı erişimi
                    setIsAuthorized(true);
                }
            } catch {
                SecurityService.logSecurityEvent('AUTHORIZATION_CHECK_ERROR', {
                    path: location.pathname
                });
                setIsAuthorized(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuthorization();
    }, [requireAdmin, location.pathname]);

    // Session kontrolü için interval
    useEffect(() => {
        if (requireAdmin && isAuthorized) {
            const interval = setInterval(() => {
                if (!SecurityService.isValidAdminSession()) {
                    SecurityService.logSecurityEvent('SESSION_EXPIRED', {
                        path: location.pathname
                    });
                    SecurityService.destroyAdminSession();
                    window.location.href = '/panel/login';
                }
            }, 60000); // Her dakika kontrol et

            return () => clearInterval(interval);
        }
    }, [requireAdmin, isAuthorized, location.pathname]);

    if (isChecking) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Yetki kontrolü...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        if (requireAdmin) {
            return <Navigate to="/panel/login" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}