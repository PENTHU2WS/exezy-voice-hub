import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useAuthStore } from '../../store/authStore';
import { useEffect } from 'react';
import { CommandPalette } from '../common/CommandPalette';
import { LevelUpListener } from '../common/LevelUpListener';
import { Toaster } from 'sonner';

interface LayoutProps {
    children: ReactNode;
    showNavbar?: boolean;
    disableFooter?: boolean;
    hideNavPadding?: boolean;
}

export function Layout({ children, showNavbar = true, disableFooter = false, hideNavPadding = false }: LayoutProps) {
    const { initialize } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    return (
        <div className="min-h-screen bg-dev-black text-white selection:bg-neon-violet/30 selection:text-white">
            <Toaster position="top-center" theme="dark" />
            <CommandPalette />
            <LevelUpListener />

            {showNavbar && <Navbar />}
            <main className={showNavbar && !hideNavPadding ? 'pt-16' : ''}>
                {children}
            </main>
            {showNavbar && !disableFooter && <Footer />}
        </div>
    );
}
