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
  MoreVertical,
  Copy,
  Check,
  Globe,
  ExternalLink
} from 'lucide-react';

export function triggerPwaInstall() {
  window.dispatchEvent(new CustomEvent('focusx:open-install'));
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('android'); // 'android' | 'ios' | 'desktop'
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

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

    // Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

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
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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

      {/* Install Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 text-white rounded-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
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

              <div className="relative p-5 sm:p-7 overflow-y-auto">
                {/* Header with App Logo */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2 shadow-xl shadow-indigo-600/30 shrink-0 flex items-center justify-center border border-indigo-400/30">
                    <img 
                      src="/pwa-192x192.png" 
                      alt="FocusFlow Icon" 
                      className="w-full h-full object-contain filter drop-shadow"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }} 
                    />
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        PWA App
                      </span>
                      <span className="text-xs text-slate-400">• Mobile & Desktop</span>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-1">
                      Install FocusFlow
                    </h2>
                    <p className="text-xs text-slate-300/80">
                      Add to your home screen for full-screen app experience
                    </p>
                  </div>
                </div>

                {/* Platform Selector Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-800/90 rounded-2xl border border-slate-700/60 mb-4">
                  <button
                    type="button"
                    onClick={() => setPlatform('android')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                      platform === 'android'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform('ios')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                      platform === 'ios'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>iPhone / iOS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform('desktop')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                      platform === 'desktop'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>PC / Mac</span>
                  </button>
                </div>

                {/* Instructions Card based on Platform */}
                {platform === 'android' && (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-indigo-200 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-indigo-400" />
                        How to install on Android (Chrome / Edge / Brave):
                      </p>
                    </div>
                    <div className="space-y-2.5 text-xs text-slate-200">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                        <div>
                          <span>Tap the <strong>browser menu (3 dots)</strong></span>
                          <span className="inline-flex items-center px-1.5 py-0.5 mx-1 bg-slate-800 rounded border border-slate-700 text-indigo-300 font-bold">
                            <MoreVertical className="w-3.5 h-3.5 inline" />
                          </span>
                          <span>in the top right corner.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                        <div>
                          <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                        <div>
                          <span>Tap <strong>"Install"</strong>. FocusFlow will appear as an app on your home screen!</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-indigo-500/20 text-[11px] text-slate-400">
                      💡 <em>Note: If opened inside an in-app browser (like WhatsApp), tap the 3 dots and choose <strong>"Open in Chrome"</strong> first.</em>
                    </div>
                  </div>
                )}

                {platform === 'ios' && (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 mb-4 space-y-3">
                    <p className="text-xs font-extrabold text-indigo-200 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                      How to install on iPhone / iPad (Safari):
                    </p>
                    <div className="space-y-2.5 text-xs text-slate-200">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                        <div>
                          <span>Tap the <strong>Share button</strong></span>
                          <span className="inline-flex items-center px-1.5 py-0.5 mx-1 bg-slate-800 rounded border border-slate-700 text-indigo-300 font-bold">
                            <Share className="w-3.5 h-3.5 inline" />
                          </span>
                          <span>at the bottom of Safari.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                        <div>
                          <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                          <span className="inline-flex items-center px-1.5 py-0.5 mx-1 bg-slate-800 rounded border border-slate-700 text-indigo-300 font-bold">
                            <PlusSquare className="w-3.5 h-3.5 inline" />
                          </span>
                          <span>.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                        <div>
                          <span>Tap <strong>"Add"</strong> in the top-right corner.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {platform === 'desktop' && (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 mb-4 space-y-3">
                    <p className="text-xs font-extrabold text-indigo-200 flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-indigo-400" />
                      How to install on Chrome / Edge (Desktop):
                    </p>
                    <div className="space-y-2 text-xs text-slate-200">
                      <p>
                        Look for the <strong>Install icon (⊕ or 💻)</strong> on the right side of the browser address bar, or click the browser menu (<strong>⋮</strong>) &rarr; <strong>"Install FocusFlow"</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Features strip */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
                    <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-[11px] font-bold text-slate-200">Fast Launch</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-[11px] font-bold text-slate-200">Full Screen</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
                    <Globe className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-[11px] font-bold text-slate-200">Live Sync</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white rounded-2xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Link Copied!' : 'Copy App Link'}</span>
                  </button>

                  {deferredPrompt ? (
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install App Now</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 text-indigo-200" />
                      <span>Got It, I'll Add to Home Screen</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
