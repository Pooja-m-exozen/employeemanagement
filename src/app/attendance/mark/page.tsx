'use client';

import { useState, useRef, useEffect } from 'react';
import { FaCamera, FaSpinner, FaCheckCircle, FaExclamationCircle, FaMapMarkerAlt, FaUserCheck, FaClock, FaCalendarAlt, FaInfoCircle, FaStopCircle, FaTimes } from 'react-icons/fa';
import { isAuthenticated } from '@/services/auth';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

// Camera Modal Component
const CameraModal = ({ isOpen, onClose, onCapture }: { isOpen: boolean; onClose: () => void; onCapture: (photo: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions and try again.');
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const startCountdown = () => {
    setIsCapturing(true);
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(timer);
          capturePhoto();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally if using front camera
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(photoData);
        setIsCapturing(false);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="relative bg-white rounded-3xl p-6 max-w-3xl w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaCamera className="text-blue-600" />
            Take Your Photo
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isCapturing}
          >
            <FaTimes className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {cameraError ? (
          <div className="p-6 text-center">
            <div className="mb-4 text-red-500">
              <FaExclamationCircle className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-lg text-red-600 font-medium">{cameraError}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              
              {/* Overlay for countdown and guidelines */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Face outline guide */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white/30 rounded-full"></div>
                </div>
                
                {/* Countdown display */}
                {countdown && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl font-bold text-white animate-pulse">
                      {countdown}
                    </div>
                  </div>
                )}
              </div>

              {/* Camera controls */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-6">
                <button
                  onClick={toggleCamera}
                  disabled={isCapturing}
                  className="bg-white/20 backdrop-blur-md text-white p-4 rounded-full hover:bg-white/30 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                
                <button
                  onClick={startCountdown}
                  disabled={isCapturing}
                  className="bg-blue-600 text-white p-6 rounded-full hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center"
                >
                  {isCapturing ? (
                    <FaSpinner className="w-8 h-8 animate-spin" />
                  ) : (
                    <FaCamera className="w-8 h-8" />
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <FaInfoCircle className="text-blue-600" />
                Position your face within the circle and ensure good lighting for the best results
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Improved loading indicator
const LoadingIndicator = () => (
  <div className="flex items-center justify-center p-12">
    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    <p className="text-gray-600 ml-4">Loading...</p>
  </div>
);

// Enhanced feedback messages with animation
const FeedbackMessage = ({ message, type }: { message: string; type: 'success' | 'error' }) => (
  <div 
    className={`flex items-center gap-3 p-4 rounded-xl animate-slideIn ${
      type === 'success' 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100' 
        : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-100'
    }`}
  >
    <div className={`p-2 rounded-full ${
      type === 'success' ? 'bg-green-100' : 'bg-red-100'
    }`}>
      {type === 'success' ? (
        <FaCheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <FaExclamationCircle className="w-5 h-5 text-red-600" />
      )}
    </div>
    <p className={`text-sm font-medium ${
      type === 'success' ? 'text-green-800' : 'text-red-800'
    }`}>
      {message}
    </p>
  </div>
);

function MarkAttendanceContent() {
  const router = useRouter();
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [markAttendanceError, setMarkAttendanceError] = useState<string | null>(null);
  const [markAttendanceSuccess, setMarkAttendanceSuccess] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, [router]);

  const updateDateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }));
    setCurrentDate(now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  };

  const handlePhotoCapture = (photoData: string) => {
    setPhotoPreview(photoData);
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('Failed to get location: ' + error.message));
        }
      );
    });
  };

  const handleMarkAttendance = async () => {
    try {
      setMarkingAttendance(true);
      setMarkAttendanceError(null);
      setLocationError(null);

      if (!photoPreview) {
        setMarkAttendanceError('Please capture your photo first');
        return;
      }

      let location;
      try {
        location = await getCurrentLocation();
      } catch (error) {
        setLocationError('Failed to get location. Please enable location services.');
        return;
      }

      const response = await fetch('https://cafm.zenapi.co.in/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: 'EFMS3295',
          photo: photoPreview,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMarkAttendanceSuccess('Attendance marked successfully!');
        setPhotoPreview(null);
      } else {
        throw new Error(data.message || 'Failed to mark attendance');
      }
    } catch (error: any) {
      setMarkAttendanceError(error.message || 'Failed to mark attendance');
    } finally {
      setMarkingAttendance(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Mark Attendance</h1>
          <p className="mt-2 text-lg text-gray-600">Complete your daily attendance verification</p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                !photoPreview ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
              }`}>
                <FaCamera className="w-5 h-5" />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">Photo Capture</p>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full ${photoPreview ? 'bg-green-500' : 'bg-gray-200'}`} />
            </div>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                markAttendanceSuccess ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'
              }`}>
                <FaUserCheck className="w-5 h-5" />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">Verification</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="p-8">
              {/* Time and Date Display */}
              <div className="flex justify-center mb-8">
                <div className="bg-gray-50 rounded-xl p-4 inline-flex items-center space-x-8">
                  <div className="flex items-center space-x-3">
                    <FaClock className="text-blue-600 w-6 h-6" />
                    <div>
                      <p className="text-sm text-gray-500">Current Time</p>
                      <p className="text-lg font-semibold text-gray-900">{currentTime}</p>
                    </div>
                  </div>
                  <div className="w-px h-12 bg-gray-200" />
                  <div className="flex items-center space-x-3">
                    <FaCalendarAlt className="text-blue-600 w-6 h-6" />
                    <div>
                      <p className="text-sm text-gray-500">Today's Date</p>
                      <p className="text-lg font-semibold text-gray-900">{currentDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Preview Section */}
              <div className="mb-8">
                <div className="max-w-2xl mx-auto">
                  {photoPreview ? (
                    <div className="relative rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-[400px] object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                        <div className="flex justify-between items-center">
                          <p className="text-white font-medium">Photo Captured Successfully</p>
                          <button
                            onClick={() => setPhotoPreview(null)}
                            className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                          >
                            Retake Photo
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-300">
                      <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <FaCamera className="w-12 h-12 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Capture</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Please ensure you're in a well-lit area and your face is clearly visible
                      </p>
                      <button
                        onClick={() => setShowCameraModal(true)}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <FaCamera className="w-5 h-5 mr-2" />
                        Start Camera
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Messages */}
              <div className="max-w-2xl mx-auto space-y-4 mb-8">
                {locationError && <FeedbackMessage message={locationError} type="error" />}
                {markAttendanceError && <FeedbackMessage message={markAttendanceError} type="error" />}
                {markAttendanceSuccess && <FeedbackMessage message={markAttendanceSuccess} type="success" />}
              </div>

              {/* Action Button */}
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleMarkAttendance}
                  disabled={markingAttendance || !photoPreview}
                  className={`w-full flex items-center justify-center px-6 py-4 rounded-lg text-base font-medium transition-all duration-200 ${
                    markingAttendance || !photoPreview
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {markingAttendance ? (
                    <>
                      <FaSpinner className="animate-spin w-5 h-5 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaUserCheck className="w-5 h-5 mr-2" />
                      Mark Attendance
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions Panel */}
          <div className="mt-8 bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaInfoCircle className="w-5 h-5 text-blue-600 mr-2" />
              Important Instructions
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-semibold text-blue-600">1</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Enable Permissions</h4>
                </div>
                <p className="text-sm text-gray-600">Allow camera and location access when prompted.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-semibold text-blue-600">2</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Clear Photo</h4>
                </div>
                <p className="text-sm text-gray-600">Ensure good lighting and face the camera directly.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-semibold text-blue-600">3</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Verify & Submit</h4>
                </div>
                <p className="text-sm text-gray-600">Review your photo before marking attendance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handlePhotoCapture}
      />
    </div>
  );
}

export default function MarkAttendancePage() {
  return (
    <DashboardLayout>
      <MarkAttendanceContent />
    </DashboardLayout>
  );
}

// Add these styles to your global CSS
const styles = `
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out forwards;
}
`; 