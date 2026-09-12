import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  PenTool, 
  UploadCloud, 
  Trash2, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Sliders, 
  ShieldCheck, 
  FileSignature, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import api, { getFileUrl } from '../lib/api';

const PEN_COLORS = [
  { label: 'Executive Navy', value: '#0f172a', preview: 'bg-slate-900' },
  { label: 'Ballpoint Blue', value: '#1d4ed8', preview: 'bg-blue-700' },
  { label: 'Classic Black', value: '#000000', preview: 'bg-black' },
];

const STROKE_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 3.5 },
  { label: 'Bold', value: 5 },
];

export default function UserSettingsModal({ user, isOpen, onClose, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('draw'); // 'draw' | 'upload'
  const [saving, setSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Current user's existing signature
  const [currentSignUrl, setCurrentSignUrl] = useState(user?.ESignURL || user?.e_sign_url || '');

  // DRAW STATE
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState(PEN_COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1].value);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawHistory, setDrawHistory] = useState([]);

  // UPLOAD STATE
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [processedDataUrl, setProcessedDataUrl] = useState('');
  const [threshold, setThreshold] = useState(210); // paper brightness threshold (0-255)
  const [feather, setFeather] = useState(35); // smooth alpha zone
  const [enhanceInk, setEnhanceInk] = useState(true);
  const [inkColorMode, setInkColorMode] = useState('darken'); // 'darken' | 'navy' | 'original'
  const fileInputRef = useRef(null);

  // Sync user prop
  useEffect(() => {
    if (user?.ESignURL || user?.e_sign_url) {
      setCurrentSignUrl(user?.ESignURL || user?.e_sign_url);
    }
  }, [user]);

  // ---------------------------------------------------------
  // CANVAS DRAWING LOGIC
  // ---------------------------------------------------------
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support high DPI screens
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (rect.width || 600) * dpr;
    canvas.height = (rect.height || 220) * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setDrawHistory([]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setTimeout(() => initCanvas(), 50);
    }
  }, [isOpen, initCanvas]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);

    // Save snapshot for undo
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawHistory(prev => [...prev.slice(-15), snapshot]);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = strokeWidth;
    setIsDrawing(true);
    setHasDrawn(true);
    setErrorMsg('');
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      if (e) e.preventDefault();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setDrawHistory([]);
  };

  const undoDraw = () => {
    if (drawHistory.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const prev = drawHistory[drawHistory.length - 1];
    ctx.putImageData(prev, 0, 0);
    setDrawHistory(prevList => prevList.slice(0, -1));
    if (drawHistory.length <= 1) {
      setHasDrawn(false);
    }
  };

  // ---------------------------------------------------------
  // BACKGROUND REMOVAL ALGORITHM (HTML5 Canvas Pixel Processing)
  // ---------------------------------------------------------
  const processImageBackgroundRemoval = useCallback(() => {
    if (!rawImageSrc) {
      setIsProcessing(false);
      return;
    }
    setIsProcessing(true);

    const timer = setTimeout(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const maxDim = 1000;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const offCanvas = document.createElement('canvas');
          offCanvas.width = w;
          offCanvas.height = h;
          const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);

          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          let minX = w, minY = h, maxX = 0, maxY = 0;
          let inkPixelCount = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Perceived luminance (ITU-R BT.601)
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum >= threshold) {
              data[i + 3] = 0; // Transparent paper
            } else {
              const x = (i / 4) % w;
              const y = Math.floor((i / 4) / w);

              const lowerBound = threshold - feather;
              let alpha = 255;
              if (lum > lowerBound) {
                alpha = Math.round(255 * (1 - (lum - lowerBound) / (threshold - lowerBound)));
              }

              data[i + 3] = alpha;

              if (alpha > 25) {
                inkPixelCount++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }

              if (enhanceInk) {
                if (inkColorMode === 'navy') {
                  data[i] = Math.min(r, 20);
                  data[i + 1] = Math.min(g, 40);
                  data[i + 2] = Math.max(b, 100);
                } else if (inkColorMode === 'darken') {
                  data[i] = Math.round(r * 0.35);
                  data[i + 1] = Math.round(g * 0.35);
                  data[i + 2] = Math.round(b * 0.35);
                }
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);

          if (inkPixelCount > 30 && maxX > minX && maxY > minY) {
            const pad = 16;
            const cropX = Math.max(0, minX - pad);
            const cropY = Math.max(0, minY - pad);
            const cropW = Math.min(w - cropX, maxX - minX + pad * 2);
            const cropH = Math.min(h - cropY, maxY - minY + pad * 2);

            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = cropW;
            cropCanvas.height = cropH;
            const cropCtx = cropCanvas.getContext('2d');
            cropCtx.drawImage(offCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

            setProcessedDataUrl(cropCanvas.toDataURL('image/png'));
          } else {
            setProcessedDataUrl(offCanvas.toDataURL('image/png'));
          }
        } catch (err) {
          console.error('Error processing background removal:', err);
          setErrorMsg('Failed to process image background.');
        } finally {
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setErrorMsg('Failed to load image format.');
        setIsProcessing(false);
      };

      img.src = rawImageSrc;
    }, 20);

    return () => clearTimeout(timer);
  }, [rawImageSrc, threshold, feather, enhanceInk, inkColorMode]);

  // Re-process when sliders change
  useEffect(() => {
    if (rawImageSrc) {
      processImageBackgroundRemoval();
    }
  }, [rawImageSrc, threshold, feather, enhanceInk, inkColorMode, processImageBackgroundRemoval]);

  const handleFileProcess = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      setRawImageSrc(event.target.result);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file. Please try another image.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    handleFileProcess(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  // ---------------------------------------------------------
  // EXPORT & SAVE TO BACKEND
  // ---------------------------------------------------------
  const cropCanvasContent = (sourceCanvas) => {
    const ctx = sourceCanvas.getContext('2d');
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    let hasInk = false;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 20) {
        const x = (i / 4) % w;
        const y = Math.floor((i / 4) / w);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasInk = true;
      }
    }

    if (!hasInk) return null;

    const pad = 20;
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropW = Math.min(w - cropX, maxX - minX + pad * 2);
    const cropH = Math.min(h - cropY, maxY - minY + pad * 2);

    const out = document.createElement('canvas');
    out.width = cropW;
    out.height = cropH;
    const outCtx = out.getContext('2d');
    outCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    return out.toDataURL('image/png');
  };

  const handleSaveSignature = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    let finalDataUrl = '';

    if (activeTab === 'draw') {
      if (!hasDrawn) {
        setErrorMsg('Please draw your signature before saving.');
        return;
      }
      finalDataUrl = cropCanvasContent(canvasRef.current);
      if (!finalDataUrl) {
        setErrorMsg('Canvas appears empty. Please draw your signature.');
        return;
      }
    } else {
      // Upload mode
      if (!processedDataUrl) {
        setErrorMsg('Please select or upload a signature image first.');
        return;
      }
      finalDataUrl = processedDataUrl;
    }

    setSaving(true);
    try {
      const res = await api.post('/user/esign', {
        image_data: finalDataUrl,
      });

      const updatedUrl = res.data?.e_sign_url || finalDataUrl;
      setCurrentSignUrl(updatedUrl);
      setSuccessMsg('E-Signature saved & background processed successfully!');

      // Update local storage user object
      const stored = localStorage.getItem('user');
      let updatedUser = { ...user, ESignURL: updatedUrl, e_sign_url: updatedUrl };
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.ESignURL = updatedUrl;
          parsed.e_sign_url = updatedUrl;
          localStorage.setItem('user', JSON.stringify(parsed));
          updatedUser = parsed;
        } catch (_e) {
          // ignore
        }
      }

      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }

      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save e-signature. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSignature = async () => {
    if (!window.confirm('Are you sure you want to remove your saved e-signature?')) return;
    setSaving(true);
    setErrorMsg('');
    try {
      await api.delete('/user/esign');
      setCurrentSignUrl('');
      setSuccessMsg('E-Signature removed successfully.');

      const stored = localStorage.getItem('user');
      let updatedUser = { ...user, ESignURL: '', e_sign_url: '' };
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.ESignURL = '';
          parsed.e_sign_url = '';
          localStorage.setItem('user', JSON.stringify(parsed));
          updatedUser = parsed;
        } catch (_e) {
          // ignore
        }
      }

      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete signature.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <FileSignature className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                User Settings & E-Signature
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Configure your digital approval signature with automated background removal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* User Details Badge */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                {(user?.Username || user?.LoginName || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{user?.Username || user?.LoginName}</p>
                <p className="text-xs text-slate-500">
                  Login ID: <span className="font-semibold text-slate-700">{user?.LoginName || user?.login_name}</span> • Focus ID: <span className="font-semibold text-slate-700">{user?.FocusUserID || 1}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {user?.Role || user?.role || 'normal'}
              </span>
              {currentSignUrl ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Active E-Sign
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> No Signature
                </span>
              )}
            </div>
          </div>

          {/* Current Saved Signature Preview */}
          {currentSignUrl && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Currently Active E-Signature
                </span>
                <button
                  type="button"
                  onClick={handleDeleteSignature}
                  disabled={saving}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
              <div className="w-full h-24 rounded-xl border border-dashed border-slate-200 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] flex items-center justify-center p-3">
                <img 
                  src={getFileUrl(currentSignUrl)} 
                  alt="Saved E-Signature" 
                  className="max-h-full max-w-full object-contain filter drop-shadow-sm" 
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                This signature is stamped automatically onto invoice documents upon your approval.
              </p>
            </div>
          )}

          {/* Setup / Update Signature Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {currentSignUrl ? 'Update Your E-Signature' : 'Create Your E-Signature'}
              </label>

              {/* Mode Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setActiveTab('draw'); setErrorMsg(''); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'draw'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Draw</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('upload'); setErrorMsg(''); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'upload'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload & Auto-Remove BG</span>
                </button>
              </div>
            </div>

            {/* TAB 1: DRAW SIGNATURE */}
            {activeTab === 'draw' && (
              <div className="space-y-3">
                {/* Canvas Drawing Tools */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {/* Pen Colors */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Color:</span>
                    <div className="flex items-center gap-1.5">
                      {PEN_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setPenColor(c.value)}
                          className={`w-6 h-6 rounded-full ${c.preview} flex items-center justify-center transition-transform ${
                            penColor === c.value ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'hover:scale-105'
                          }`}
                          title={c.label}
                        >
                          {penColor === c.value && <Check className="w-3 h-3 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stroke Widths */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Thickness:</span>
                    <div className="flex items-center gap-1">
                      {STROKE_WIDTHS.map(sw => (
                        <button
                          key={sw.value}
                          type="button"
                          onClick={() => setStrokeWidth(sw.value)}
                          className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                            strokeWidth === sw.value 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-white text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {sw.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={undoDraw}
                      disabled={drawHistory.length === 0}
                      className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Undo stroke"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Clear canvas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Draw Canvas with Transparency Checkerboard */}
                <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-colors rounded-2xl overflow-hidden bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-52 touch-none cursor-crosshair block"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                      <PenTool className="w-7 h-7 mb-1.5 opacity-40" />
                      <p className="text-xs font-semibold">Sign here with mouse, finger, or stylus</p>
                      <p className="text-[10px] text-slate-400">Saved directly on transparent alpha layer</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: UPLOAD & AUTO-REMOVE BACKGROUND */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                {/* Upload Box */}
                {!rawImageSrc ? (
                  <div
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer?.files?.[0];
                      if (file) handleFileProcess(file);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/40 scale-[0.99]'
                        : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20'
                    } ${isProcessing ? 'cursor-wait bg-slate-50' : 'cursor-pointer'} group`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    {isProcessing ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                        <p className="text-sm font-bold text-slate-800">Processing Signature Image...</p>
                        <p className="text-xs text-slate-500 mt-1 animate-pulse">Removing paper background & isolating ink strokes...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">Upload paper photo or signature scan</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, or WEBP. Paper background will be automatically made transparent.</p>
                        <span className="inline-block mt-3 px-3 py-1 bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-700 rounded-lg text-xs font-semibold transition-colors">
                          Browse files or drag & drop here
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Before & After Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Original */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-600">Original Document Photo:</span>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              setRawImageSrc(null);
                              setProcessedDataUrl('');
                            }}
                            className="text-[11px] text-indigo-600 font-semibold hover:underline disabled:opacity-50"
                          >
                            Change Photo
                          </button>
                        </div>
                        <div className="h-36 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-2">
                          <img src={rawImageSrc} alt="Original" className="max-h-full max-w-full object-contain" />
                        </div>
                      </div>

                      {/* Processed (Transparent) */}
                      <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-200 relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            Processed (Transparent PNG):
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isProcessing ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isProcessing ? 'Processing...' : 'Auto BG Removed'}
                          </span>
                        </div>
                        <div className="h-36 rounded-xl overflow-hidden border border-dashed border-indigo-300 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] flex items-center justify-center p-2 relative">
                          {isProcessing ? (
                            <div className="flex flex-col items-center justify-center p-3 text-center bg-white/80 backdrop-blur-sm rounded-xl inset-2 absolute">
                              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-1.5" />
                              <span className="text-xs font-semibold text-slate-700">Removing background...</span>
                              <span className="text-[10px] text-slate-500">Isolating clean ink</span>
                            </div>
                          ) : processedDataUrl ? (
                            <img src={processedDataUrl} alt="Processed" className="max-h-full max-w-full object-contain filter drop-shadow-md" />
                          ) : (
                            <span className="text-xs text-slate-400">No signature detected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fine-Tuning Sliders */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Background Removal Fine-Tuning
                        </span>
                        <span className="text-[11px] text-slate-500">Adjust if paper has shadows</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                            <span>Paper Threshold</span>
                            <span className="text-indigo-600 font-bold">{threshold}</span>
                          </div>
                          <input
                            type="range"
                            min="120"
                            max="250"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                            <span>Edge Feathering</span>
                            <span className="text-indigo-600 font-bold">{feather}px</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="60"
                            value={feather}
                            onChange={(e) => setFeather(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Ink Options */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enhanceInk}
                            onChange={(e) => setEnhanceInk(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Enhance ink contrast</span>
                        </label>

                        {enhanceInk && (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500 mr-1">Ink Tone:</span>
                            <button
                              type="button"
                              onClick={() => setInkColorMode('darken')}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${inkColorMode === 'darken' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                              Jet Black
                            </button>
                            <button
                              type="button"
                              onClick={() => setInkColorMode('navy')}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${inkColorMode === 'navy' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                              Executive Navy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveSignature}
            disabled={saving || isProcessing || (activeTab === 'draw' && !hasDrawn) || (activeTab === 'upload' && (!processedDataUrl || isProcessing))}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Signature...</span>
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Image...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save E-Signature</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
