import React from 'react';

interface LoadingScreenProps {
    progress: number;
    statusMessage: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, statusMessage }) => {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 flex flex-col justify-center items-center p-4 transition-opacity duration-500">
            <div className="w-full max-w-md text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 tracking-wider" style={{ textShadow: '0 0 10px rgba(74, 222, 128, 0.3)' }}>
                    Tu Tiên Ký: Hư Vô Lộ
                </h1>
                
                <div className="mt-8">
                    <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden border border-slate-600">
                        <div 
                            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-slate-400 mt-3 text-sm animate-pulse">
                        {statusMessage}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
