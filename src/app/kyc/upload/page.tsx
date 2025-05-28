'use client';

import { useState } from 'react';
import { FaUpload, FaSpinner, FaCheckCircle, FaTimesCircle, FaFileAlt, FaExclamationCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/auth';

interface DocumentUpload {
  type: 'aadhar' | 'pan' | 'passport' | 'photo';
  file: File | null;
  preview: string | null;
  uploading: boolean;
  error: string | null;
  success: boolean;
}

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

  const handleFileChange = (type: 'aadhar' | 'pan' | 'passport' | 'photo') => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    const requiredDocuments = ['aadhar', 'pan', 'photo'];
    const missingDocuments = requiredDocuments.filter(type => !documents[type].file);

    if (missingDocuments.length > 0) {
      setGlobalError(`Please select all required documents: ${missingDocuments.join(', ')}`);
      return;
    }

    try {
      await Promise.all(
        Object.keys(documents)
          .filter(type => documents[type as keyof typeof documents].file)
          .map(type => uploadDocument(type as 'aadhar' | 'pan' | 'passport' | 'photo'))
      );
      setGlobalSuccess('All documents uploaded successfully!');
    } catch (error) {
      setGlobalError('Failed to upload some documents. Please try again.');
    }
  };

  const DocumentUploadCard = ({ type, label, required = false }: { type: 'aadhar' | 'pan' | 'passport' | 'photo'; label: string; required?: boolean }) => {
    const doc = documents[type];

    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
            {required && <span className="text-sm text-red-500">Required</span>}
          </div>
          {doc.success && <FaCheckCircle className="w-6 h-6 text-green-500" />}
        </div>

        <div className="space-y-4">
          {doc.preview ? (
            <div className="relative aspect-[3/2] rounded-lg overflow-hidden bg-gray-100">
              <img
                src={doc.preview}
                alt={`${label} preview`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setDocuments(prev => ({
                  ...prev,
                  [type]: { ...documents[type], file: null, preview: null }
                }))}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <FaTimesCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-[3/2] rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer bg-gray-50 transition-colors">
              <div className="flex flex-col items-center justify-center p-6">
                <FaFileAlt className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to select {label}</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 5MB</p>
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
            <button
              onClick={() => uploadDocument(type)}
              disabled={doc.uploading}
              className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                doc.uploading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
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
            </button>
          )}

          {doc.error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{doc.error}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Upload KYC Documents</h1>
        <button
          onClick={handleUploadAll}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Upload All Documents
        </button>
      </div>

      {globalError && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <FaExclamationCircle className="w-5 h-5 flex-shrink-0" />
          <p>{globalError}</p>
        </div>
      )}

      {globalSuccess && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <FaCheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{globalSuccess}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentUploadCard type="aadhar" label="Aadhar Card" required />
        <DocumentUploadCard type="pan" label="PAN Card" required />
        <DocumentUploadCard type="passport" label="Passport" />
        <DocumentUploadCard type="photo" label="Profile Photo" required />
      </div>
    </div>
  );
} 