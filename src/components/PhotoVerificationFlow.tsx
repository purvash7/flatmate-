import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Sparkles, UserCheck, ArrowRight, X, FlipHorizontal } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface PhotoVerificationFlowProps {
  onPhotoUploaded: (photoUrl: string) => void;
  existingUrl?: string;
  isMain?: boolean;
}

export const PhotoVerificationFlow: React.FC<PhotoVerificationFlowProps> = ({
  onPhotoUploaded,
  existingUrl,
  isMain = true
}) => {
  const { profile, updateProfileState } = useAuth();

  // Step 1: Liveness Peace Sign (✌️)
  // Step 2: Upload Profile Photo & Authenticity Verification
  // Step 3: Verified Result
  const [currentStep, setCurrentStep] = useState<'liveness' | 'profile_photo' | 'complete'>(
    existingUrl && profile?.liveness_verified ? 'complete' : 'liveness'
  );

  // Liveness state
  const [livePhoto, setLivePhoto] = useState<string | null>(profile?.live_verification_photo || null);
  const [isLiveChecking, setIsLiveChecking] = useState(false);
  const [livenessError, setLivenessError] = useState<string | null>(null);
  const [livenessSuccess, setLivenessSuccess] = useState(profile?.liveness_verified || false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(existingUrl || null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [similarityScore, setSimilarityScore] = useState<number | null>(profile?.photo_similarity_score || null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const livenessFileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);

  // Callback ref to reliably attach media stream to the video element as soon as it mounts in DOM
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(err => {
        console.warn('Video autoplay prevented:', err);
      });
    }
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // 1. Camera Handling for Live Peace Sign Check
  const startCamera = async () => {
    setLivenessError(null);
    setIsCameraLoading(true);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser. Please use the camera snapshot button or file upload.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      // If videoRef is already mounted, attach immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Autoplay error:', playErr);
        }
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setIsCameraActive(false);
      setLivenessError(
        'Could not access webcam directly. You can use your phone camera or upload a selfie holding up a peace sign ✌️.'
      );
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
  };

  const captureLivePeaceSign = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 640;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the image un-mirrored for standard recognition
        ctx.drawImage(video, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.88);
        stopCamera();
        setLivePhoto(base64);
        processLivenessVerification(base64, 'image/jpeg');
      }
    } catch (e: any) {
      setLivenessError('Could not take snapshot. Please try uploading a photo instead.');
    }
  };

  const handleLivenessFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setLivePhoto(base64);
      processLivenessVerification(base64, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const processLivenessVerification = async (base64: string, mimeType: string) => {
    setIsLiveChecking(true);
    setLivenessError(null);

    try {
      const res = await api.verifyLiveness({
        photo_base64: base64,
        mime_type: mimeType
      });

      if (res.passed) {
        setLivenessSuccess(true);
        if (profile) {
          updateProfileState({
            ...profile,
            liveness_verified: true,
            live_verification_photo: base64
          });
        }
        // Advance to step 2 after brief confirmation
        setTimeout(() => {
          setCurrentStep('profile_photo');
        }, 1000);
      } else {
        setLivenessError(res.message || 'Please make sure you are clearly holding up a peace sign (✌️) with your fingers.');
      }
    } catch (err: any) {
      setLivenessError(err.message || 'Could not verify liveness. Please try taking another photo with a clear peace sign ✌️.');
    } finally {
      setIsLiveChecking(false);
    }
  };

  // 2. Profile Photo Upload and Verification Check
  const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setMatchError('Photo exceeds 8MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setProfilePhoto(base64);
      await processFaceMatchVerification(base64, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const processFaceMatchVerification = async (base64: string, mimeType: string) => {
    setIsMatching(true);
    setMatchError(null);
    setVerificationFeedback(null);

    try {
      // 1. Run face matching and AI generation prevention check
      const matchRes = await api.verifyFaceMatch({
        live_photo_base64: livePhoto || undefined,
        profile_photo_base64: base64,
        mime_type: mimeType
      });

      setSimilarityScore(matchRes.similarity_percentage);
      setVerificationFeedback(matchRes.feedback);

      if (matchRes.passed) {
        // 2. Save photo to user profile
        const uploadRes = await api.uploadPhoto({
          photo_base64: base64,
          mime_type: mimeType,
          is_main: isMain
        });

        updateProfileState(uploadRes.profile);
        onPhotoUploaded(uploadRes.photo.url);
        setCurrentStep('complete');
      } else {
        if (matchRes.is_ai_generated) {
          setMatchError('AI-generated or synthetic avatars are not permitted. Please upload a genuine photo of yourself.');
        } else {
          setMatchError(
            matchRes.feedback ||
            'Photo does not clearly match your live selfie. Please upload a clearer photo of yourself.'
          );
        }
      }
    } catch (err: any) {
      setMatchError(err.message || 'Face verification failed. Please ensure the uploaded photo clearly matches your live photo.');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto w-full min-w-0" id="photo-verification-container">
      {/* Hidden file inputs */}
      <input
        ref={livenessFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLivenessFileUpload}
        className="hidden"
      />
      {/* Mobile front camera selfie trigger */}
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleLivenessFileUpload}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleProfilePhotoSelect}
        className="hidden"
      />

      {/* Progress Indicators */}
      <div className="flex items-center justify-between px-2 text-xs font-bold text-[#7A7D87]">
        <div className={`flex items-center gap-1.5 ${currentStep === 'liveness' ? 'text-[#E07A5F]' : livenessSuccess ? 'text-[#4F8A6D]' : ''}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shrink-0 ${currentStep === 'liveness' ? 'bg-[#E07A5F]' : livenessSuccess ? 'bg-[#4F8A6D]' : 'bg-[#7A7D87]'}`}>
            {livenessSuccess ? '✓' : '1'}
          </span>
          <span className="truncate">Live Peace Sign ✌️</span>
        </div>
        <div className="w-8 border-t border-[#E6E3DE] shrink-0" />
        <div className={`flex items-center gap-1.5 ${currentStep === 'profile_photo' ? 'text-[#E07A5F]' : currentStep === 'complete' ? 'text-[#4F8A6D]' : ''}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shrink-0 ${currentStep === 'profile_photo' ? 'bg-[#E07A5F]' : currentStep === 'complete' ? 'bg-[#4F8A6D]' : 'bg-[#7A7D87]'}`}>
            {currentStep === 'complete' ? '✓' : '2'}
          </span>
          <span className="truncate">Profile Photo</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* STEP 1: LIVENESS PEACE SIGN CHECK */}
      {/* ========================================================= */}
      {currentStep === 'liveness' && (
        <div className="bg-white rounded-3xl border border-[#E6E3DE] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#E07A5F]/15 text-[#E07A5F] flex items-center justify-center mx-auto text-2xl">
              ✌️
            </div>
            <h3 className="font-display font-bold text-lg text-[#2B2D42]">
              Liveness Check with Peace Sign
            </h3>
            <p className="text-xs text-[#7A7D87] max-w-xs mx-auto leading-relaxed">
              Hold up a clear <strong>peace sign (✌️)</strong> next to your face to verify physical presence and keep FlatMate+ scam-free.
            </p>
          </div>

          {/* Camera View or Captured Snapshot */}
          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-xs mx-auto border-2 border-[#E07A5F] shadow-lg">
              <video
                ref={setVideoRef}
                className="w-full h-full object-cover -scale-x-100"
                autoPlay
                playsInline
                muted
              />

              {/* Viewfinder overlay */}
              <div className="absolute inset-0 border-2 border-dashed border-white/40 m-4 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-bold flex items-center gap-1.5 shadow">
                  <span>✌️ Hold peace sign near face</span>
                </div>
                <div className="text-white/60 text-[10px] font-semibold bg-black/40 px-2 py-0.5 rounded">
                  Ensure good lighting
                </div>
              </div>

              {/* Action Buttons inside live camera */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 z-10">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3.5 py-1.5 bg-white/90 hover:bg-white text-[#2B2D42] text-xs font-bold rounded-xl backdrop-blur-sm shadow"
                >
                  Cancel
                </button>
                <button
                  id="capture-peace-sign-btn"
                  type="button"
                  onClick={captureLivePeaceSign}
                  className="w-14 h-14 rounded-full bg-[#E07A5F] hover:bg-[#D4694E] border-4 border-white shadow-xl flex items-center justify-center text-white text-xl hover:scale-105 active:scale-95 transition-transform"
                  title="Snap Peace Sign Photo"
                >
                  ✌️
                </button>
              </div>
            </div>
          ) : livePhoto ? (
            <div className="relative rounded-2xl overflow-hidden aspect-square max-w-xs mx-auto border-2 border-[#E6E3DE] bg-black shadow-md">
              <img src={livePhoto} alt="Live Peace Sign Capture" className="w-full h-full object-cover" />

              {isLiveChecking && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                  <RefreshCw className="w-8 h-8 text-[#E07A5F] animate-spin mb-2" />
                  <p className="text-sm font-bold text-[#2B2D42]">Analyzing Live Photo...</p>
                  <p className="text-xs text-[#7A7D87] mt-1">Verifying peace sign ✌️ and facial presence</p>
                </div>
              )}

              {livenessSuccess && !isLiveChecking && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-[#4F8A6D] text-white flex items-center justify-center mb-2 shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-extrabold text-[#2B2D42]">Peace Sign Verified! ✌️</p>
                  <p className="text-xs text-[#4F8A6D] font-bold mt-0.5">Moving to Profile Photo upload...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 sm:p-6 border-2 border-dashed border-[#E6E3DE] rounded-2xl text-center bg-[#FAF8F4] space-y-4">
              <div className="text-4xl">✌️👤</div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#2B2D42]">Take a Live Peace Sign Photo</h4>
                <p className="text-xs text-[#7A7D87] mt-1">Snap a quick photo holding your peace fingers up.</p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  id="start-liveness-camera-btn"
                  type="button"
                  disabled={isCameraLoading}
                  onClick={startCamera}
                  className="w-full py-3 px-4 rounded-xl bg-[#E07A5F] text-white font-bold text-sm hover:bg-[#D4694E] shadow-sm flex items-center justify-center gap-2 min-h-[46px] transition-all"
                >
                  {isCameraLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Opening Camera...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Open Live Camera for ✌️</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => mobileCameraInputRef.current?.click()}
                    className="py-2.5 px-3 rounded-xl bg-white border border-[#E6E3DE] text-[#2B2D42] font-bold text-xs hover:bg-[#FAF8F4] flex items-center justify-center gap-1.5 min-h-[42px] transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#E07A5F]" />
                    <span>Phone Selfie</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => livenessFileInputRef.current?.click()}
                    className="py-2.5 px-3 rounded-xl bg-white border border-[#E6E3DE] text-[#2B2D42] font-bold text-xs hover:bg-[#FAF8F4] flex items-center justify-center gap-1.5 min-h-[42px] transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#7A7D87]" />
                    <span>Upload Photo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {livenessError && (
            <div className="bg-[#D64545]/10 border border-[#D64545]/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#D64545]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{livenessError}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="underline font-bold text-[#E07A5F]"
                  >
                    Retry Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => mobileCameraInputRef.current?.click()}
                    className="underline font-bold text-[#2B2D42]"
                  >
                    Snap Selfie
                  </button>
                  <button
                    type="button"
                    onClick={() => livenessFileInputRef.current?.click()}
                    className="underline font-bold text-[#7A7D87]"
                  >
                    Upload File
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 2: PROFILE PHOTO UPLOAD & VERIFICATION */}
      {/* ========================================================= */}
      {currentStep === 'profile_photo' && (
        <div className="bg-white rounded-3xl border border-[#E6E3DE] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[#4F8A6D]/15 text-[#4F8A6D] flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#2B2D42]">
              Upload Your Profile Photo
            </h3>
            <p className="text-xs text-[#7A7D87] max-w-xs mx-auto leading-relaxed">
              Upload your main photo. We'll verify it matches your live peace sign photo.
            </p>
          </div>

          {/* Verification Comparison Visual */}
          {profilePhoto ? (
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] max-w-xs mx-auto border-2 border-[#E6E3DE] bg-white group shadow-sm">
              <img src={profilePhoto} alt="Profile preview" className="w-full h-full object-cover" />

              {isMatching && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                  <RefreshCw className="w-8 h-8 text-[#E07A5F] animate-spin mb-2" />
                  <p className="text-sm font-bold text-[#2B2D42]">Verifying Photo...</p>
                  <p className="text-xs text-[#7A7D87] mt-1 max-w-[200px]">
                    Matching with your live peace sign photo
                  </p>
                </div>
              )}

              {!isMatching && !matchError && (
                <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 bg-white/95 backdrop-blur-sm text-[#2B2D42] text-xs font-bold rounded-xl border border-[#E6E3DE] hover:bg-white shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Another</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#E6E3DE] hover:border-[#E07A5F]/60 rounded-3xl p-6 sm:p-8 text-center bg-[#FAF8F4] transition-colors space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#E6E3DE] flex items-center justify-center text-[#E07A5F] mx-auto shadow-sm">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#2B2D42]">Select Profile Photo</h4>
                <p className="text-xs text-[#7A7D87] mt-1">Upload a clear JPG, PNG or WEBP picture of yourself.</p>
              </div>

              <button
                id="select-profile-photo-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E07A5F] text-white font-bold text-xs sm:text-sm hover:bg-[#D4694E] shadow-sm flex items-center justify-center gap-2 mx-auto min-h-[44px]"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Profile Photo</span>
              </button>
            </div>
          )}

          {matchError && (
            <div className="bg-[#D64545]/10 border border-[#D64545]/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#D64545]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{matchError}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="underline font-bold text-[#E07A5F]"
                  >
                    Upload a different photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('liveness')}
                    className="underline font-bold text-[#7A7D87]"
                  >
                    Retake Live Peace Sign
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 3: COMPLETED & VERIFIED */}
      {/* ========================================================= */}
      {currentStep === 'complete' && profilePhoto && (
        <div className="bg-white rounded-3xl border border-[#E6E3DE] p-5 sm:p-6 shadow-sm space-y-4 text-center">
          <div className="relative rounded-2xl overflow-hidden aspect-[4/5] max-w-xs mx-auto border-2 border-[#4F8A6D]/30 shadow-md">
            <img src={profilePhoto} alt="Verified Profile" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-[#4F8A6D] text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Photo</span>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-display font-bold text-base text-[#2B2D42] flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-[#4F8A6D]" />
              <span>Photo Verified</span>
            </h4>
            <p className="text-xs text-[#7A7D87] leading-relaxed">
              Your profile photo matches your live selfie.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setProfilePhoto(null);
                setCurrentStep('profile_photo');
              }}
              className="w-full py-2.5 px-3 bg-[#FAF8F4] text-[#2B2D42] text-xs font-bold rounded-xl border border-[#E6E3DE] hover:bg-[#E6E3DE]/40 transition-colors"
            >
              Change Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setLivePhoto(null);
                setLivenessSuccess(false);
                setCurrentStep('liveness');
              }}
              className="w-full py-2.5 px-3 bg-[#FAF8F4] text-[#2B2D42] text-xs font-bold rounded-xl border border-[#E6E3DE] hover:bg-[#E6E3DE]/40 transition-colors"
            >
              Retake ✌️ Check
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
