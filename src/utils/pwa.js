// PWA utilities for service worker and installation

let deferredPrompt = null;

// Register service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔧 Registering service worker...');
      const registration = await navigator.serviceWorker.register('/PokerCashFlow/sw.js', {
        scope: '/PokerCashFlow/'
      });
      
      console.log('✅ Service Worker registered successfully:', registration.scope);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New version available. Please refresh the page.');
            showUpdateNotification();
          }
        });
      });
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  } else {
    console.log('⚠️ Service Worker not supported');
  }
};

// Show update notification
const showUpdateNotification = () => {
  if (confirm('🔄 A new version is available! Refresh now?')) {
    window.location.reload();
  }
};

// Check if app is installable
export const checkInstallability = () => {
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📱 App is installable');
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
  });

  // Check if already installed
  window.addEventListener('appinstalled', () => {
    console.log('✅ App installed successfully');
    deferredPrompt = null;
    hideInstallPrompt();
  });
};

// Show install prompt
export const showInstallPrompt = () => {
  // Create install banner
  const installBanner = document.createElement('div');
  installBanner.id = 'pwa-install-banner';
  installBanner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideUp 0.3s ease-out;
    ">
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 4px;">📱 Install Poker Cash Flow</div>
        <div style="font-size: 14px; opacity: 0.9;">Get the full app experience!</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="pwa-install-btn" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
        ">Install</button>
        <button id="pwa-dismiss-btn" style="
          background: transparent;
          border: none;
          color: white;
          padding: 8px;
          cursor: pointer;
          opacity: 0.7;
        ">✕</button>
      </div>
    </div>
    <style>
      @keyframes slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
  `;

  // Add to page if not already present
  if (!document.getElementById('pwa-install-banner')) {
    document.body.appendChild(installBanner);

    // Handle install button click
    document.getElementById('pwa-install-btn').addEventListener('click', installApp);
    
    // Handle dismiss button click
    document.getElementById('pwa-dismiss-btn').addEventListener('click', hideInstallPrompt);
  }
};

// Install the app
export const installApp = async () => {
  if (deferredPrompt) {
    console.log('📱 Installing app...');
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log('📱 Install outcome:', outcome);
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
    } else {
      console.log('❌ User dismissed the install prompt');
    }
    
    deferredPrompt = null;
    hideInstallPrompt();
  }
};

// Hide install prompt
export const hideInstallPrompt = () => {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.style.animation = 'slideDown 0.3s ease-out forwards';
    setTimeout(() => banner.remove(), 300);
  }
};

// Check if running as PWA
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Check if online
export const isOnline = () => navigator.onLine;

// Add online/offline status
export const addNetworkStatus = () => {
  const updateNetworkStatus = () => {
    const statusEl = document.getElementById('network-status');
    if (statusEl) statusEl.remove();

    if (!isOnline()) {
      const offlineBanner = document.createElement('div');
      offlineBanner.id = 'network-status';
      offlineBanner.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #f59e0b;
          color: white;
          padding: 8px;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
          z-index: 1001;
        ">
          📶 You're offline. Some features may be limited.
        </div>
      `;
      document.body.appendChild(offlineBanner);
    }
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus(); // Initial check
};

// Initialize PWA features
export const initPWA = () => {
  console.log('🚀 Initializing PWA features...');
  
  registerServiceWorker();
  checkInstallability();
  addNetworkStatus();
  
  // Show install prompt after 30 seconds if not installed
  if (!isPWA()) {
    setTimeout(() => {
      if (deferredPrompt && !document.getElementById('pwa-install-banner')) {
        showInstallPrompt();
      }
    }, 30000);
  }
  
  console.log('✅ PWA initialized');
}; 