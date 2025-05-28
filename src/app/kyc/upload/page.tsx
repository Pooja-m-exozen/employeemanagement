'use client';

import { useState } from 'react';
import { FaUpload, FaSpinner, FaCheckCircle, FaTimesCircle, FaFileAlt, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/auth';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentUpload {
  type: 'aadhar' | 'pan' | 'passport' | 'photo';
  file: File | null;
  preview: string | null;
  uploading: boolean;
  error: string | null;
  success: boolean;
}

const documentInfo = {
  aadhar: {
    label: 'Aadhar Card',
    description: 'Upload a clear copy of your Aadhar card (front and back)',
    required: true,
    formats: 'PDF, JPG, PNG (max 5MB)',
  },
  pan: {
    label: 'PAN Card',
    description: 'Upload a clear copy of your PAN card',
    required: true,
    formats: 'PDF, JPG, PNG (max 5MB)',
  },
  passport: {
    label: 'Passport',
    description: 'Upload the first and last page of your passport',
    required: false,
    formats: 'PDF, JPG, PNG (max 5MB)',
  },
  photo: {
    label: 'Profile Photo',
    description: 'Upload a recent passport-size photograph',
    required: true,
    formats: 'JPG, PNG (max 2MB)',
  },
};

export default function UploadDocuments() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>({
    aadhar: { type: 'aadhar', file: null, preview: null, uploading: false, error: null, success: false },
    pan: { type: 'pan', file: null, preview: null, uploading: false, error: null, success: false },
    passport: { type: 'passport', file: null, preview: null, uploading: false, error: null, success: false },
    photo: { type: 'photo', file: null, preview: null, uploading: false, error: null, success: false }
  });

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFileChange = (type: 'aadhar' | 'pan' | 'passport' | 'photo') => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSize = type === 'photo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setDocuments(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
        }
      }));
      return;
    }

    // Reset states
    setGlobalError(null);
    setDocuments(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        file,
        preview: URL.createObjectURL(file),
        error: null,
        success: false
      }
    }));
  };

  const uploadDocument = async (type: 'aadhar' | 'pan' | 'passport' | 'photo') => {
    const doc = documents[type];
    if (!doc.file) return;

    setDocuments(prev => ({
      ...prev,
      [type]: { ...prev[type], uploading: true, error: null }
    }));

    try {
      const formData = new FormData();
      formData.append('file', doc.file);
      formData.append('type', type);

      const response = await fetch('https://cafm.zenapi.co.in/api/kyc/EFMS3295/upload-document', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }

      setDocuments(prev => ({
        ...prev,
        [type]: { ...prev[type], success: true, uploading: false }
      }));
    } catch (error) {
      setDocuments(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          error: error instanceof Error ? error.message : 'Failed to upload document',
          uploading: false
        }
      }));
    }
  };

  const handleUploadAll = async () => {
    setGlobalError(null);
    setGlobalSuccess(null);
    setUploadProgress(0);

    const requiredDocuments = Object.entries(documentInfo)
      .filter(([_, info]) => info.required)
      .map(([type]) => type);

    const missingDocuments = requiredDocuments.filter(type => !documents[type].file);

    if (missingDocuments.length > 0) {
      setGlobalError(`Please select all required documents: ${missingDocuments.map(type => documentInfo[type].label).join(', ')}`);
      return;
    }

    try {
      const documentsToUpload = Object.keys(documents).filter(
        type => documents[type as keyof typeof documents].file
      );

      for (let i = 0; i < documentsToUpload.length; i++) {
        const type = documentsToUpload[i] as keyof typeof documents;
        await uploadDocument(type);
        setUploadProgress(((i + 1) / documentsToUpload.length) * 100);
      }

      setGlobalSuccess('All documents uploaded successfully!');
      setTimeout(() => {
        router.push('/kyc'); // Redirect to KYC page after successful upload
      }, 2000);
    } catch (error) {
      setGlobalError('Failed to upload some documents. Please try again.');
    }
  };

  const DocumentUploadCard = ({ type, label, required = false }: { type: 'aadhar' | 'pan' | 'passport' | 'photo'; label: string; required?: boolean }) => {
    const doc = documents[type];
    const info = documentInfo[type];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {label}
              {required && <span className="text-xs text-red-500 font-normal">Required</span>}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{info.description}</p>
          </div>
          <AnimatePresence>
            {doc.success && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-green-500"
              >
                <FaCheckCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          {doc.preview ? (
            <div className="relative aspect-[3/2] rounded-lg overflow-hidden bg-gray-100 group">
              <img
                src={doc.preview}
                alt={`${label} preview`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setDocuments(prev => ({
                  ...prev,
                  [type]: { ...documents[type], file: null, preview: null }
                }))}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <FaTimesCircle className="w-4 h-4" />
              </motion.button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-[3/2] rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer bg-gray-50 transition-all hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center p-6">
                <FaFileAlt className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to select {label}</p>
                <p className="text-xs text-gray-400 mt-1">{info.formats}</p>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange(type)}
                className="hidden"
              />
            </label>
          )}

          {doc.file && !doc.success && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => uploadDocument(type)}
              disabled={doc.uploading}
              className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-all ${
                doc.uploading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
              }`}
            >
              {doc.uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FaUpload />
                  Upload {label}
                </span>
              )}
            </motion.button>
          )}

          {doc.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg"
            >
              <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{doc.error}</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload KYC Documents</h1>
            <p className="text-gray-500 mt-1">Please upload all required documents to complete your KYC verification</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUploadAll}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:shadow-md font-medium w-full md:w-auto"
          >
            Upload All Documents
          </motion.button>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="h-full bg-blue-600"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Uploading documents... {Math.round(uploadProgress)}%</p>
          </div>
        )}

        <AnimatePresence>
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg mt-4"
            >
              <FaExclamationCircle className="w-5 h-5 flex-shrink-0" />
              <p>{globalError}</p>
            </motion.div>
          )}

          {globalSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg mt-4"
            >
              <FaCheckCircle className="w-5 h-5 flex-shrink-0" />
              <p>{globalSuccess}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentUploadCard type="aadhar" label="Aadhar Card" required />
        <DocumentUploadCard type="pan" label="PAN Card" required />
        <DocumentUploadCard type="passport" label="Passport" />
        <DocumentUploadCard type="photo" label="Profile Photo" required />
      </div>
    </div>
  );
} 