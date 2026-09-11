import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Share, 
  PlusSquare,
  ArrowDownToLine
} from 'lucide-react';

export function triggerPwaInstall() {
  window.dispatchEvent(new CustomEvent('focusx:open-install'));
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if already in standalone / installed mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleMobile);

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsOpen(false);
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for manual trigger from Header or Sidebar
    const handleManualOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('focusx:open-install', handleManualOpen);

    // Onload presentation: show install prompt unless already dismissed in this session
    const hasDismissed = sessionStorage.getItem('focusx_pwa_dismissed');
    const timer = setTimeout(() => {
      if (!isStandalone && !hasDismissed) {
        setIsOpen(true);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('focusx:open-install', handleManualOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setIsOpen(false);
        setDeferredPrompt(null);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else if (isIOS) {
      // Keep open showing the iOS step-by-step instructions
    } else {
      // Fallback for browsers that don't support beforeinstallprompt directly
      alert('To install FocusFlow, look for the Install icon (⊕ or 💻) in your browser address bar, or use the browser menu (⋮) -> "Install FocusFlow".');
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('focusx_pwa_dismissed', 'true');
  };

  if (isInstalled && !installSuccess) {
    return null;
  }

  return (
    <>
      {/* Installation Success Notification */}
      <AnimatePresence>
        {installSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <div>
              <p className="font-bold text-sm">FocusFlow Installed!</p>
              <p className="text-xs text-emerald-100">App ready on your home screen or dock.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onload Install Modal / Card */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 text-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Decorative Accent Glow */}
              <div className="absolute -top-24 -left-24 w-56 h-56 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative p-6 sm:p-8">
                {/* Header with App Logo */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2.5 shadow-xl shadow-indigo-600/30 shrink-0 flex items-center justify-center border border-indigo-400/30">
                    <img 
                      src="/pwa-192x192.png" 
                      alt="FocusFlow Icon" 
                      className="w-full h-full object-contain filter drop-shadow"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }} 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Official App
                      </span>
                      <span className="text-xs text-slate-400">• Ready to Download</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                      Install FocusFlow App
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300/80 mt-0.5">
                      Focus ERP Invoice Approval Workspace
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Install FocusFlow directly to your desktop or mobile device for instant access, offline resilience, and rapid one-click invoice approvals.
                </p>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex sm:flex-col items-center sm:items-start gap-3 text-left">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Instant Launch</h4>
                      <p className="text-[11px] text-slate-400">Opens without browser chrome</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex sm:flex-col items-center sm:items-start gap-3 text-left">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">ERP Sync</h4>
                      <p className="text-[11px] text-slate-400">Real-time secure database link</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex sm:flex-col items-center sm:items-start gap-3 text-left">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Multi-Device</h4>
                      <p className="text-[11px] text-slate-400">Desktop, Android & iOS</p>
                    </div>
                  </div>
                </div>

                {/* iOS Guidance if detected */}
                {isIOS ? (
                  <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 mb-6 space-y-2.5">
                    <p className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-indigo-400" /> How to install on iOS Safari:
                    </p>
                    <div className="space-y-1.5 text-xs text-indigo-100/90">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/30 font-bold flex items-center justify-center text-[10px]">1</span>
                        <span>Tap the <strong>Share button</strong> (<Share className="w-3.5 h-3.5 inline text-indigo-300" />) at the bottom toolbar.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/30 font-bold flex items-center justify-center text-[10px]">2</span>
                        <span>Scroll and select <strong>"Add to Home Screen"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-indigo-300" />).</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/30 font-bold flex items-center justify-center text-[10px]">3</span>
                        <span>Tap <strong>"Add"</strong> in the top-right corner.</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors text-center"
                  >
                    Maybe Later
                  </button>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download / Install App</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
