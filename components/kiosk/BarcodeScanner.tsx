'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Zap, ZapOff, RefreshCcw } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState<string | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for BarcodeDetector support
    if (!('BarcodeDetector' in window)) {
      setSupported(false);
      setHasError('Barcode Detection API wird von diesem Browser nicht unterstützt. Bitte nutze Chrome oder Android.');
      return;
    }
    setSupported(true);

    let stream: MediaStream | null = null;
    let detectionInterval: NodeJS.Timeout | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsDetecting(true);
        }
      } catch (err) {
        setHasError('Zugriff auf die Kamera verweigert oder nicht verfügbar.');
        console.error('Camera error:', err);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionInterval) clearInterval(detectionInterval);
    };
  }, []);

  // Detection Loop
  useEffect(() => {
    if (!isDetecting || !supported) return;

    // @ts-ignore - BarcodeDetector might not be in the global types yet
    const barcodeDetector = new window.BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
    });

    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const barcodes = await barcodeDetector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          onScan(code);
          setIsDetecting(false); // Stop detecting after first success
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
    };

    const interval = setInterval(detect, 200); // 5 times per second
    return () => clearInterval(interval);
  }, [isDetecting, onScan, supported]);

  const toggleFlash = async () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    
    try {
      // @ts-ignore
      await track.applyConstraints({
        advanced: [{ torch: !isFlashOn } as any]
      });
      setIsFlashOn(!isFlashOn);
    } catch (err) {
      console.warn('Flash not supported on this device');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-bold text-sm tracking-widest uppercase">
          Barcode Scannen
        </span>
        <button
          onClick={toggleFlash}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white"
        >
          {isFlashOn ? <ZapOff className="w-5 h-5 text-amber-400" /> : <Zap className="w-5 h-5" />}
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {hasError ? (
          <div className="p-8 text-center space-y-4">
            <p className="text-white/80 text-sm leading-relaxed">{hasError}</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm mx-auto"
            >
              <RefreshCcw className="w-4 h-4" />
              Neu laden
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Scanner Overlay UI */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] max-w-[300px] aspect-square relative">
                {/* Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-lg" />
                
                {/* Animated Line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-scanner-scan" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-10 bg-black text-center">
        <p className="text-white/60 text-[10px] uppercase tracking-[0.2em]">
          Halte den Barcode in den Rahmen
        </p>
      </div>

      <style jsx global>{`
        @keyframes scanner-scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scanner-scan {
          animation: scanner-scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
