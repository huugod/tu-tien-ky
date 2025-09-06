import React, { useState } from 'react';
import { API_BASE_URL } from '../config/config';
import { getClientId } from '../constants';

interface AuthProps {
  onLoginSuccess: (token: string, playerName: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const url = isLogin ? `${API_BASE_URL}/auth/login` : `${API_BASE_URL}/auth/register`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': getClientId(), // Gửi mã định danh client
        },
        body: JSON.stringify({ name, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra.');
      }

      if (isLogin) {
        onLoginSuccess(data.token, data.playerName);
      } else {
        setMessage('Đăng ký thành công! Vui lòng chuyển qua tab Đăng nhập.');
        setIsLogin(true); // Switch to login form after successful registration
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 tracking-wider" style={{ textShadow: '0 0 10px rgba(74, 222, 128, 0.3)' }}>
                Tu Tiên Ký: Hư Vô Lộ
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Nhập Đạo Môn, vấn trường sinh.</p>
        </header>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-8 backdrop-blur-sm">
          <div className="flex border-b border-slate-700 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-center font-semibold transition-colors duration-200 ${isLogin ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-center font-semibold transition-colors duration-200 ${!isLogin ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            >
              Đăng Ký
            </button>
          </div>

          <h2 className="text-2xl font-bold text-center text-white mb-6">
            {isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản Mới'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-400">
                Đạo Hiệu (Tài khoản)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-slate-400">
                Mật Khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              />
               {!isLogin && <p className="text-xs text-slate-500 mt-1">Tối thiểu 6 ký tự.</p>}
            </div>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            {message && <p className="text-sm text-green-400 text-center">{message}</p>}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 disabled:bg-slate-500 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;