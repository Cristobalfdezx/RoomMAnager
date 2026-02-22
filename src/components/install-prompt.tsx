'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Funciones auxiliares para detectar fuera del componente
function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const nav = navigator as unknown as { standalone?: boolean };
  const iosStandalone = 'standalone' in navigator && nav.standalone;
  
  return standalone || iosStandalone;
}

function getIsIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Si ya está instalada, no hacer nada
    if (getIsStandalone()) return;

    const isIOS = getIsIOS();

    // Escuchar el evento de instalación (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar después de un tiempo para no ser intrusivo
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Mostrar prompt para iOS después de un tiempo
    if (isIOS) {
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 10000);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  // No mostrar si ya está instalada
  if (getIsStandalone()) return null;

  const isIOS = getIsIOS();

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 lg:bottom-6 left-4 right-4 z-50"
        >
          <Card className="shadow-xl border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  {isIOS ? (
                    <Share className="w-6 h-6" />
                  ) : (
                    <Download className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">¡Instala RoomManager!</p>
                  <p className="text-sm text-white/80">
                    {isIOS 
                      ? 'Toca "Compartir" → "Añadir a pantalla de inicio"'
                      : 'Acceso rápido desde tu pantalla de inicio'
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={handleDismiss}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {!isIOS && deferredPrompt && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white text-emerald-600 hover:bg-white/90"
                      onClick={handleInstall}
                    >
                      Instalar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
