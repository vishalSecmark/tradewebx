"use client";
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import FileUploadChunked from '@/components/upload/FileUploadChunked';
import { UploadSummary } from '@/types/upload';
import { toast } from 'react-toastify';

const UploadFile = () => {
    const { colors } = useTheme();

    // Handle upload completion
    const handleUploadComplete = (summary: UploadSummary) => {
        console.log('Upload completed:', summary);
        // You can add additional logic here, like showing a success modal
        // or updating analytics
    };

    // Handle upload errors
    const handleUploadError = (error: string) => {
        console.error('Upload error:', error);
        toast.error(`Upload failed: ${error}`);
    };

    return (
        <div className="px-1">
            {/* Header Section */}
            <div className="flex border-b border-gray-200">
                <div className="flex flex-1 gap-2">
                    <button
                        style={{ backgroundColor: colors.cardBackground }}
                        className={`px-4 py-2 text-sm rounded-t-lg font-bold bg-${colors.primary} text-${colors.buttonText}`}
                    >
                        Upload File
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div
                className="mt-4 p-6 border rounded-lg"
                style={{
                    backgroundColor: colors.cardBackground,
                    borderColor: '#e5e7eb',
                    minHeight: '400px'
                }}
            >
                {/* Instructions */}
                <div className="mb-6">
                    <h2
                        className="text-2xl font-semibold mb-2"
                        style={{ color: colors.text }}
                    >
                        Large File Upload System
                    </h2>
                    <p
                        className="text-sm text-gray-600 mb-4"
                        style={{ color: colors.text }}
                    >
                        Upload CSV, TXT, or Excel files up to 3GB with 10+ crore records.
                        Files are processed in chunks using streaming to ensure smooth performance.
                    </p>
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> For files larger than 500MB, CSV or TXT format is highly recommended.
                            Excel files (.xls, .xlsx) require more memory and may be slower for very large datasets.
                        </p>
                    </div>

                    {/* Features List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                                <p className="font-semibold" style={{ color: colors.text }}>
                                    Streaming Processing
                                </p>
                                <p className="text-sm text-gray-500">
                                    Files are processed in chunks without loading entire file into memory
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                                <p className="font-semibold" style={{ color: colors.text }}>
                                    Real-time Progress
                                </p>
                                <p className="text-sm text-gray-500">
                                    Track upload progress, speed, and estimated time remaining
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                                <p className="font-semibold" style={{ color: colors.text }}>
                                    Error Handling
                                </p>
                                <p className="text-sm text-gray-500">
                                    Automatic retry for failed chunks with detailed error tracking
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                                <p className="font-semibold" style={{ color: colors.text }}>
                                    Pause & Resume
                                </p>
                                <p className="text-sm text-gray-500">
                                    Control upload process with pause, resume, and cancel options
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* File Upload Component */}
                <FileUploadChunked
                    apiEndpoint="https://trade-plus.in/TPLUSNARIMAN/api/ThirdPartyService/ImportLargeFile"
                    chunkSize={10000}
                    maxFileSize={3 * 1024 * 1024 * 1024} // 3GB
                    allowedFileTypes={['csv', 'txt', 'xls', 'xlsx']}
                    delayBetweenChunks={50}
                    maxRetries={3}
                    onUploadComplete={handleUploadComplete}
                    onUploadError={handleUploadError}
                />

                {/* Additional Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Configuration - Optimized for Large Files</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Max File Size: 3GB (supports 10+ crore records)</li>
                        <li>• Chunk Size: 10,000 records per request</li>
                        <li>• Delay Between Chunks: 50ms (faster uploads)</li>
                        <li>• Max Retries: 3 attempts per failed chunk</li>
                        <li>• Streaming: Memory-efficient processing for massive files</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default UploadFile;
