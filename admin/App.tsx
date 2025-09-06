import { FC, useState, useEffect } from 'react';
import AdminLogin from './components/auth/AdminLogin';
import AdminDashboard from './components/dashboard/AdminDashboard';

const App: FC = () => {
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            setAdminToken(token);
        }
        setIsLoading(false);
    }, []);

    const handleLoginSuccess = (token: string) => {
        localStorage.setItem('admin_token', token);
        setAdminToken(token);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        setAdminToken(null);
    };

    if (isLoading) {
        return <div className="min-h-screen flex justify-center items-center"><p>Đang tải...</p></div>;
    }

    if (!adminToken) {
        return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }

    return <AdminDashboard token={adminToken} onLogout={handleLogout} />;
};

export default App;