import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { api } from '../services/api.js';

interface PhotoUploaderProps {
  onPhotoUploaded: (photoUrl: string) => void;
  isMain?: boolean;
  existingUrl?: string;
  onRemove?: () => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onPhotoUploaded,
  isMain = true,
  existingUrl,
  onRemove
}) => {
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Photo exceeds 8MB limit. Please upload a smaller image.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Please select a JPG, JPEG, PNG, or WEBP photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
      await uploadAndVerify(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const uploadAndVerify = async (base64: string, mimeType: string) => {
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.uploadPhoto({
        photo_base64: base64,
        mime_type: mimeType,
        is_main: isMain
      });

      setSuccess(true);
      onPhotoUploaded(res.photo.url);
    } catch (err: any) {
      setError(err.message || "We couldn't verify this as a real photo. Please upload a clear photo of yourself.");
    } finally {
      setUploading(false);
    }
  };

  // Camera Capture
  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      setError('Could not access camera. Please use file upload instead.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      setPreview(base64);
      uploadAndVerify(base64, 'image/jpeg');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Camera Live View */}
      {isCameraActive ? (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-sm mx-auto border-2 border-[#E07A5F]">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
            <button
              id="cancel-camera-btn"
              type="button"
              onClick={stopCamera}
              className="px-4 py-2 bg-white/80 text-[#2B2D42] text-xs font-bold rounded-xl backdrop-blur-sm"
            >
              Cancel
            </button>
            <button
              id="capture-photo-btn"
              type="button"
              onClick={capturePhoto}
              className="w-14 h-14 rounded-full bg-[#E07A5F] border-4 border-white shadow-lg flex items-center justify-center text-white"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>
        </div>
      ) : preview ? (
        /* Image Preview Box */
        <div className="relative rounded-2xl overflow-hidden aspect-[4/5] max-w-sm mx-auto border-2 border-[#E6E3DE] bg-white group">
          <img src={preview} alt="Profile" className="w-full h-full object-cover" />

          {uploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <RefreshCw className="w-8 h-8 text-[#E07A5F] animate-spin mb-2" />
              <p className="text-sm font-bold text-[#2B2D42]">Verifying & Uploading...</p>
              <p className="text-xs text-[#7A7D87] text-center mt-1">Checking photo authenticity and quality</p>
            </div>
          )}

          {success && !uploading && (
            <div className="absolute top-3 left-3 bg-[#4F8A6D] text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Photo</span>
            </div>
          )}

          {onRemove && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onRemove();
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="absolute bottom-3 left-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 bg-white/90 backdrop-blur-sm text-[#2B2D42] text-xs font-bold rounded-xl border border-[#E6E3DE] hover:bg-white shadow-sm flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Change</span>
            </button>
            <button
              type="button"
              onClick={startCamera}
              className="flex-1 py-2 px-3 bg-white/90 backdrop-blur-sm text-[#2B2D42] text-xs font-bold rounded-xl border border-[#E6E3DE] hover:bg-white shadow-sm flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Retake</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload State */
        <div className="border-2 border-dashed border-[#E6E3DE] hover:border-[#E07A5F]/60 rounded-3xl p-8 text-center bg-white transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF8F4] border border-[#E6E3DE] flex items-center justify-center text-[#E07A5F] mx-auto mb-4">
            <Camera className="w-7 h-7" />
          </div>
          <h4 className="font-display font-bold text-base text-[#2B2D42]">
            {isMain ? 'Add your main photo' : 'Add an additional photo'}
          </h4>
          <p className="text-xs text-[#7A7D87] mt-1 max-w-xs mx-auto">
            Upload a clear, authentic picture of yourself. (JPG, PNG, WEBP up to 8MB)
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
            <button
              id="upload-file-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#E07A5F] text-white font-bold text-sm hover:bg-[#D4694E] shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>
            <button
              id="take-photo-btn"
              type="button"
              onClick={startCamera}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-[#E6E3DE] text-[#2B2D42] font-bold text-sm hover:bg-[#FAF8F4] flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Camera className="w-4 h-4 text-[#7A7D87]" />
              <span>Take Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-[#D64545]/10 border border-[#D64545]/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#D64545]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 underline font-bold"
            >
              Try another photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
