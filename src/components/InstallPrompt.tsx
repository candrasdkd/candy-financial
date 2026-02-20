import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check if app is already installed
        const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
        setIsStandalone(isAppInstalled);

        if (isAppInstalled) return;

        // Detect iOS (case-insensitive)
        const userAgent = window.navigator.userAgent || window.navigator.vendor || (window as any).opera;
        const isIosDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    // If it's explicitly standalone, don't show.
    // Otherwise, always show if isVisible is true.
    if (isStandalone || !isVisible) return null;

    // Show banner on Android even if we don't have the prompt event yet (e.g. user is on local HTTP)
    // We just don't show the "Install" button in that case.

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
            <div className="bg-sage-600 text-cream-50 px-4 py-4 pb-6 flex items-start gap-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] rounded-t-2xl border-t border-sage-500">
                <div className="flex-1">
                    <p className="font-display font-medium mb-1">
                        Install Aplikasi
                    </p>
                    <p className="font-body text-xs text-cream-100/90 leading-tight">
                        {isIOS ? (
                            <>
                                Tap icon <Share className="inline w-3.5 h-3.5 mx-1" /> di browser bawah lalu pilih <strong>Add to Home Screen</strong>.
                            </>
                        ) : deferredPrompt ? (
                            'Install DuaHati Finance di home screen agar lebih mudah dan cepat diakses.'
                        ) : (
                            'Install via menu browser (titik tiga) lalu pilih "Add to Home Screen" atau "Install app".'
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {!isIOS && deferredPrompt && (
                        <button
                            onClick={handleInstallClick}
                            className="px-3 py-1.5 bg-cream-50 text-sage-800 rounded-lg text-xs font-semibold shadow-sm hover:bg-cream-100 transition-colors flex items-center gap-1.5"
                        >
                            <Download className="w-4 h-4" />
                            Install
                        </button>
                    )}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 -mr-2 -mt-1 text-cream-200 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
