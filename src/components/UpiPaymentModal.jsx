'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, QrCode, X, Check, Smartphone, ArrowRight, ShieldCheck, Copy, Camera, PhoneCall } from 'lucide-react';
import QRCode from 'qrcode';

export default function UpiPaymentModal({
  settlement,
  creditorMember,
  onClose,
  onFinalizeUpiSettle,
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedNum, setCopiedNum] = useState(false);
  const [activeView, setActiveView] = useState('qr'); // 'qr' | 'scanner'
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);

  const payeeName = creditorMember?.name || settlement?.to || 'Friend';
  const payeeUpi = creditorMember?.upi_id || creditorMember?.upi || 'naqeeb@upi';
  const payeeNumber = creditorMember?.upi_number || creditorMember?.upiNumber || '';
  const amount = settlement?.amount || 0;

  // Construct standard valid UPI VPA string
  const validPayeeAddress = payeeUpi || (payeeNumber ? `${payeeNumber}@upi` : 'naqeeb@upi');

  // UPI standard URI specification
  const upiUri = `upi://pay?pa=${encodeURIComponent(validPayeeAddress)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Tripwise Settlement')}`;

  // Intent URLs for specific Android Apps
  const gpayIntent = `intent://pay?pa=${encodeURIComponent(validPayeeAddress)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=Tripwise%20Settlement#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`;
  const phonePeIntent = `intent://pay?pa=${encodeURIComponent(validPayeeAddress)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=Tripwise%20Settlement#Intent;scheme=upi;package=com.phonepe.app;end;`;

  useEffect(() => {
    QRCode.toDataURL(upiUri, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [upiUri]);

  // Handle live camera activation for scanner mode
  const startCamera = async () => {
    setActiveView('scanner');
    setCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (e) {
      console.warn('Camera access fallback:', e);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(validPayeeAddress);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyUpiNum = () => {
    if (!payeeNumber) return;
    navigator.clipboard.writeText(payeeNumber);
    setCopiedNum(true);
    setTimeout(() => setCopiedNum(false), 2000);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!settlement) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-md shadow-2xl relative"
        >
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 rounded-2xl shadow-md">
              <CreditCard className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                Direct UPI Settlement
              </h3>
              <p className="text-xs text-slate-400">
                Pay directly via UPI ID or Mobile Number
              </p>
            </div>
          </div>

          {/* View Selector Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl mb-4 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => { stopCamera(); setActiveView('qr'); }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeView === 'qr'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Show QR & Details</span>
            </button>
            <button
              onClick={startCamera}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeView === 'scanner'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Scanner</span>
            </button>
          </div>

          {/* Amount and Recipient Details */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center mb-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Amount to Pay
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400 my-0.5">
              ₹{Number(amount).toLocaleString('en-IN')}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              To: <strong className="text-slate-900 dark:text-slate-100">{payeeName}</strong>
            </div>

            {/* UPI ID & UPI Number Details */}
            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 space-y-1.5">
              <div className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-teal-500" />
                  UPI ID:
                </span>
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                  <span>{validPayeeAddress}</span>
                  <button onClick={handleCopyUpiId} className="hover:text-teal-300 transition">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copiedId && <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>}
                </div>
              </div>

              {payeeNumber && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <PhoneCall className="w-3 h-3 text-emerald-500" />
                    UPI Number:
                  </span>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span>{payeeNumber}</span>
                    <button onClick={handleCopyUpiNum} className="hover:text-emerald-300 transition">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copiedNum && <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeView === 'qr' ? (
            <>
              {qrDataUrl && (
                <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
                  <img src={qrDataUrl} alt="Dynamic UPI QR Code" className="w-40 h-40 rounded-lg shadow-inner" />
                  <span className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Dynamic QR with exact amount for {validPayeeAddress}
                  </span>
                </div>
              )}

              {/* Direct App Launch Links */}
              <div className="space-y-2 mb-4">
                <a
                  href={gpayIntent}
                  onClick={() => { stopCamera(); onFinalizeUpiSettle(settlement); }}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-teal-500 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-teal-500" />
                    <span>Google Pay (GPay)</span>
                  </div>
                  <span className="text-teal-500 font-bold">Launch App →</span>
                </a>

                <a
                  href={phonePeIntent}
                  onClick={() => { stopCamera(); onFinalizeUpiSettle(settlement); }}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-purple-500 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-500" />
                    <span>PhonePe</span>
                  </div>
                  <span className="text-purple-500 font-bold">Launch App →</span>
                </a>

                <a
                  href={upiUri}
                  onClick={() => { stopCamera(); onFinalizeUpiSettle(settlement); }}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>Default UPI / Paytm / BHIM</span>
                  </div>
                  <span className="text-emerald-500 font-bold">Pay via UPI →</span>
                </a>
              </div>
            </>
          ) : (
            /* Live Camera Scanner View */
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 mb-4 relative overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-48 object-cover rounded-xl border border-teal-500/50"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-36 h-36 border-2 border-dashed border-teal-400 rounded-xl animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-2 text-center">
                Position recipient's physical QR code within frame
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => { stopCamera(); onFinalizeUpiSettle(settlement); }}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-3 rounded-2xl text-xs sm:text-sm transition shadow-md shadow-teal-500/20"
          >
            Mark Settled Manually After Payment
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

