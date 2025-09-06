import React, { FC, useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { API_BASE_URL } from '../../config/config';

interface AdminLoginProps {
    onLoginSuccess: (token: string) => void;
}
const AdminLogin: FC<AdminLoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Đăng nhập thất bại.');
            onLoginSuccess(data.admin_token);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4">
             <div className="w-full max-w-sm">
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
                        Admin Login
                    </h1>
                </header>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-8">
                     <form onSubmit={handleSubmit} className="space-y-6">
                        <Input 
                            label="Tên đăng nhập" 
                            type="text" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            required 
                        />
                        <Input 
                            label="Mật khẩu" 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                        </Button>
                     </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;