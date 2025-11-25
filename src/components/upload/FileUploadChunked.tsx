"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaFile, FaCheck, FaTimes, FaPause, FaPlay, FaRedo, FaDownload, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  UploadConfig,
  UploadProgress,
  ChunkData,
  ChunkResult,
  FailedChunk,
  UploadSummary,
  FileMetadata,
} from '@/types/upload';
import {
  validateFile,
  getFileMetadata,
  formatFileSize,
  formatDuration,
  generateSessionId,
  parseCSVStream,
  parseTXTStream,
  downloadAsCSV,
  getDataPreview,
} from '@/utils/fileParser';
import {
  uploadChunksSequentially,
  calculateUploadStats,
  createChunks,
} from '@/utils/uploadService';
import { useTheme } from '@/context/ThemeContext';

interface FileUploadChunkedProps {
  apiEndpoint: string;
  chunkSize?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  delayBetweenChunks?: number;
  maxRetries?: number;
  onUploadComplete?: (summary: UploadSummary) => void;
  onUploadError?: (error: string) => void;
  metadata?: {
    filters?: Record<string, any>;
    selectedRecord?: any;
    [key: string]: any;
  };
}

const FileUploadChunked: React.FC<FileUploadChunkedProps> = ({
  apiEndpoint,
  chunkSize = 10000, // Increased default for large files
  maxFileSize = 3 * 1024 * 1024 * 1024, // 3GB default
  allowedFileTypes = ['csv', 'txt', 'xls', 'xlsx'],
  delayBetweenChunks = 50, // Reduced delay for faster uploads
  maxRetries = 3,
  onUploadComplete,
  onUploadError,
  metadata,
}) => {
  const { colors } = useTheme();

  // Dynamic chunk size based on file size
  const getOptimalChunkSize = (fileSize: number): number => {
    if (fileSize < 10 * 1024 * 1024) return 5000; // < 10MB: 5k records
    if (fileSize < 100 * 1024 * 1024) return 10000; // < 100MB: 10k records
    if (fileSize < 500 * 1024 * 1024) return 15000; // < 500MB: 15k records
    return 20000; // >= 500MB: 20k records for maximum throughput
  };

  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [dynamicChunkSize, setDynamicChunkSize] = useState<number>(chunkSize);
  const [progress, setProgress] = useState<UploadProgress>({
    totalRecords: 0,
    processedRecords: 0,
    failedRecords: 0,
    currentChunk: 0,
    totalChunks: 0,
    percentage: 0,
    speed: 0,
    estimatedTimeRemaining: 0,
    status: 'idle',
  });
  const [failedChunks, setFailedChunks] = useState<FailedChunk[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: any[] }>({ headers: [], rows: [] });
  const [summary, setSummary] = useState<UploadSummary | null>(null);

  // Refs
  const parserAbortRef = useRef<{ abort: () => void } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const shouldContinueRef = useRef(true);
  const allDataRef = useRef<any[]>([]);
  const headersRef = useRef<string[]>([]);
  const startTimeRef = useRef<number>(0);
  const processedCountRef = useRef<number>(0);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const validation = validateFile(file, allowedFileTypes, maxFileSize);

    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const metadata = getFileMetadata(file);
    const optimalChunkSize = getOptimalChunkSize(file.size);

    setSelectedFile(file);
    setFileMetadata(metadata);
    setDynamicChunkSize(optimalChunkSize);
    setProgress({
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      currentChunk: 0,
      totalChunks: 0,
      percentage: 0,
      speed: 0,
      estimatedTimeRemaining: 0,
      status: 'idle',
    });
    setFailedChunks([]);
    setSummary(null);
    allDataRef.current = [];
    headersRef.current = [];

    // Show info about optimal chunk size for large files
    if (file.size > 100 * 1024 * 1024) {
      toast.info(`Large file detected! Using optimized chunk size: ${optimalChunkSize.toLocaleString()} records per chunk`);
    }
  }, [allowedFileTypes, maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    disabled: progress.status === 'parsing' || progress.status === 'uploading',
  });

  // Load preview
  const loadPreview = async () => {
    if (!selectedFile) return;

    try {
      const preview = await getDataPreview(selectedFile, 10);
      setPreviewData({ headers: preview.headers, rows: preview.preview });
      setShowPreview(true);
    } catch (error: any) {
      toast.error(`Failed to load preview: ${error.message}`);
    }
  };

  // Parse CSV/TXT files
  const parseTextFile = (file: File, fileType: string) => {
    setProgress(prev => ({ ...prev, status: 'parsing' }));
    setSessionId(generateSessionId());
    allDataRef.current = [];
    headersRef.current = [];

    const onData = (chunk: any[], headers: string[]) => {
      // Store headers from first chunk
      if (headersRef.current.length === 0 && headers.length > 0) {
        headersRef.current = headers;
      }
      allDataRef.current.push(...chunk);
      setProgress(prev => ({
        ...prev,
        totalRecords: allDataRef.current.length,
      }));
    };

    const onComplete = (totalRows: number) => {
      setProgress(prev => ({
        ...prev,
        totalRecords: totalRows,
        totalChunks: Math.ceil(totalRows / dynamicChunkSize),
        status: 'idle',
      }));
      toast.success(`Parsed ${totalRows.toLocaleString()} records successfully`);
      startUpload();
    };

    const onError = (error: Error) => {
      toast.error(`Parsing error: ${error.message}`);
      setProgress(prev => ({ ...prev, status: 'error' }));
    };

    if (fileType === 'csv') {
      parserAbortRef.current = parseCSVStream(file, onData, onComplete, onError, dynamicChunkSize);
    } else {
      parserAbortRef.current = parseTXTStream(file, onData, onComplete, onError, dynamicChunkSize);
    }
  };

  // Parse Excel files using Web Worker
  const parseExcelFile = (file: File) => {
    setProgress(prev => ({ ...prev, status: 'parsing' }));
    setSessionId(generateSessionId());
    allDataRef.current = [];
    headersRef.current = [];

    // Create Web Worker
    const worker = new Worker('/workers/excelParser.worker.js');
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, data, totalRows, progress: workerProgress, error } = e.data;

      if (type === 'start') {
        setProgress(prev => ({
          ...prev,
          totalRecords: totalRows,
          totalChunks: Math.ceil(totalRows / dynamicChunkSize),
        }));
      } else if (type === 'chunk') {
        // Extract headers from first chunk
        if (headersRef.current.length === 0 && data.length > 0) {
          headersRef.current = Object.keys(data[0]);
        }
        allDataRef.current.push(...data);
        setProgress(prev => ({
          ...prev,
          totalRecords: allDataRef.current.length,
        }));
      } else if (type === 'complete') {
        toast.success(`Parsed ${totalRows.toLocaleString()} records successfully`);
        setProgress(prev => ({ ...prev, status: 'idle' }));
        worker.terminate();
        workerRef.current = null;
        startUpload();
      } else if (type === 'error') {
        toast.error(`Parsing error: ${error}`);
        setProgress(prev => ({ ...prev, status: 'error' }));
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = (error) => {
      toast.error(`Worker error: ${error.message}`);
      setProgress(prev => ({ ...prev, status: 'error' }));
      worker.terminate();
      workerRef.current = null;
    };

    // Send file to worker
    worker.postMessage({
      type: 'parse',
      file: file,
      chunkSize: dynamicChunkSize,
    });
  };

  // Start upload process
  const startUpload = async () => {
    if (allDataRef.current.length === 0) {
      toast.error('No data to upload');
      return;
    }

    shouldContinueRef.current = true;
    setIsPaused(false);
    setProgress(prev => ({ ...prev, status: 'uploading' }));
    startTimeRef.current = Date.now();
    processedCountRef.current = 0;

    const currentSessionId = sessionId || generateSessionId();

    // Create chunks from data
    const chunks = createChunks(allDataRef.current, dynamicChunkSize, currentSessionId);

    // Clear allDataRef to free up memory for large files (data is now in chunks)
    // We keep a reference count instead
    const totalRecordsCount = allDataRef.current.length;
    allDataRef.current = []; // Free memory

    const onChunkComplete = (result: ChunkResult) => {
      // Count processed records regardless of success/failure
      const recordsInChunk = chunks[result.chunkIndex].data.length;
      processedCountRef.current += recordsInChunk;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const speed = elapsed > 0 ? processedCountRef.current / elapsed : 0;
      const remainingRecords = progress.totalRecords - processedCountRef.current;
      const remaining = speed > 0 ? remainingRecords / speed : 0;

      setProgress(prev => ({
        ...prev,
        processedRecords: processedCountRef.current,
        currentChunk: result.chunkIndex + 1,
        percentage: prev.totalRecords > 0 ? Math.round((processedCountRef.current / prev.totalRecords) * 100) : 0,
        speed: Math.round(speed),
        estimatedTimeRemaining: isFinite(remaining) ? remaining : 0,
        failedRecords: result.success ? prev.failedRecords : prev.failedRecords + recordsInChunk,
      }));

      if (!result.success) {
        setFailedChunks(prev => [...prev, {
          chunkIndex: result.chunkIndex,
          data: chunks[result.chunkIndex].data,
          error: result.error || 'Unknown error',
          retryCount: result.retryCount,
        }]);
      }
    };

    try {
      const results = await uploadChunksSequentially(
        chunks,
        apiEndpoint,
        headersRef.current,
        delayBetweenChunks,
        maxRetries,
        undefined,
        onChunkComplete,
        () => shouldContinueRef.current,
        metadata
      );

      const stats = calculateUploadStats(results);
      const timeTaken = (Date.now() - startTimeRef.current) / 1000;

      const uploadSummary: UploadSummary = {
        totalRecords: progress.totalRecords,
        successfulRecords: stats.successfulRecords,
        failedRecords: stats.failedRecords,
        totalChunks: stats.totalChunks,
        failedChunks: stats.failedChunks,
        timeTaken,
        sessionId: currentSessionId,
      };

      setSummary(uploadSummary);
      setProgress(prev => ({ ...prev, status: 'completed' }));
      toast.success(`Upload completed! ${stats.successfulRecords} records uploaded successfully.`);

      if (onUploadComplete) {
        onUploadComplete(uploadSummary);
      }
    } catch (error: any) {
      toast.error(`Upload error: ${error.message}`);
      setProgress(prev => ({ ...prev, status: 'error' }));
      if (onUploadError) {
        onUploadError(error.message);
      }
    }
  };

  // Handle start upload button
  const handleStartUpload = () => {
    if (!selectedFile || !fileMetadata) return;

    const fileType = fileMetadata.extension;

    if (fileType === 'csv' || fileType === 'txt') {
      parseTextFile(selectedFile, fileType);
    } else if (fileType === 'xls' || fileType === 'xlsx') {
      parseExcelFile(selectedFile);
    }
  };

  // Pause/Resume
  const handlePauseResume = () => {
    if (isPaused) {
      shouldContinueRef.current = true;
      setIsPaused(false);
      startUpload();
    } else {
      shouldContinueRef.current = false;
      setIsPaused(true);
      setProgress(prev => ({ ...prev, status: 'paused' }));
    }
  };

  // Cancel upload
  const handleCancel = () => {
    shouldContinueRef.current = false;
    if (parserAbortRef.current) {
      parserAbortRef.current.abort();
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setProgress(prev => ({ ...prev, status: 'cancelled' }));
    toast.info('Upload cancelled');
  };

  // Retry failed chunks
  const handleRetryFailed = async () => {
    if (failedChunks.length === 0) return;

    const chunks = failedChunks.map(fc => ({
      chunkIndex: fc.chunkIndex,
      data: fc.data,
      sessionId,
      totalChunks: progress.totalChunks,
      startIndex: fc.chunkIndex * dynamicChunkSize,
      endIndex: (fc.chunkIndex + 1) * dynamicChunkSize,
    }));

    setProgress(prev => ({ ...prev, status: 'uploading' }));

    const results = await uploadChunksSequentially(
      chunks,
      apiEndpoint,
      headersRef.current,
      delayBetweenChunks,
      maxRetries,
      undefined,
      undefined,
      undefined,
      metadata
    );

    const successfulRetries = results.filter(r => r.success);
    setFailedChunks(prev => prev.filter(fc => !results.find(r => r.success && r.chunkIndex === fc.chunkIndex)));

    toast.success(`Retried ${successfulRetries.length} chunks successfully`);
    setProgress(prev => ({ ...prev, status: 'completed' }));
  };

  // Download failed chunks
  const handleDownloadFailed = () => {
    if (failedChunks.length === 0) return;

    const failedData = failedChunks.flatMap(fc => fc.data);
    downloadAsCSV(failedData, `failed_chunks_${sessionId}.csv`);
    toast.success('Failed chunks downloaded');
  };

  // Reset
  const handleReset = () => {
    setSelectedFile(null);
    setFileMetadata(null);
    setProgress({
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      currentChunk: 0,
      totalChunks: 0,
      percentage: 0,
      speed: 0,
      estimatedTimeRemaining: 0,
      status: 'idle',
    });
    setFailedChunks([]);
    setSummary(null);
    allDataRef.current = [];
    headersRef.current = [];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const isUploading = progress.status === 'uploading' || progress.status === 'parsing';

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      {!selectedFile && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          style={{ backgroundColor: isDragActive ? colors.cardBackground : 'transparent' }}
        >
          <input {...getInputProps()} />
          <FaUpload className="mx-auto text-5xl text-gray-400 mb-4" />
          <p className="text-lg font-medium" style={{ color: colors.text }}>
            {isDragActive ? 'Drop file here' : 'Drag & drop file here, or click to select'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supported: CSV, TXT, XLS, XLSX | Max size: {formatFileSize(maxFileSize)}
          </p>
        </div>
      )}

      {/* Selected File Info */}
      {selectedFile && fileMetadata && (
        <div className="border rounded-lg p-6" style={{ backgroundColor: colors.cardBackground }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <FaFile className="text-4xl text-blue-500 mt-1" />
              <div>
                <h3 className="font-semibold text-lg" style={{ color: colors.text }}>
                  {fileMetadata.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatFileSize(fileMetadata.size)} • {fileMetadata.extension.toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-red-500 hover:text-red-700"
              disabled={isUploading}
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            {progress.status === 'idle' && (
              <>
                <button
                  onClick={handleStartUpload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <FaUpload /> Start Upload
                </button>
                <button
                  onClick={loadPreview}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  style={{ color: colors.text }}
                >
                  <FaEye /> Preview
                </button>
              </>
            )}

            {(progress.status === 'uploading' || progress.status === 'paused') && (
              <>
                <button
                  onClick={handlePauseResume}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  {isPaused ? <FaPlay /> : <FaPause />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <FaTimes /> Cancel
                </button>
              </>
            )}

            {progress.status === 'completed' && failedChunks.length > 0 && (
              <>
                <button
                  onClick={handleRetryFailed}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  <FaRedo /> Retry Failed
                </button>
                <button
                  onClick={handleDownloadFailed}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <FaDownload /> Download Failed
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Progress Section */}
      {progress.status !== 'idle' && progress.totalRecords > 0 && (
        <div className="border rounded-lg p-6" style={{ backgroundColor: colors.cardBackground }}>
          <h3 className="font-semibold text-lg mb-4" style={{ color: colors.text }}>
            Upload Progress
          </h3>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: colors.text }}>
                {progress.processedRecords.toLocaleString()} of {progress.totalRecords.toLocaleString()} records
              </span>
              <span style={{ color: colors.text }}>{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-semibold" style={{ color: colors.text }}>
                {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Speed</p>
              <p className="font-semibold" style={{ color: colors.text }}>
                {progress.speed.toLocaleString()} rec/s
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time Remaining</p>
              <p className="font-semibold" style={{ color: colors.text }}>
                {formatDuration(progress.estimatedTimeRemaining)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="font-semibold text-red-600">
                {progress.failedRecords.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="border rounded-lg p-6" style={{ backgroundColor: colors.cardBackground }}>
          <div className="flex items-center gap-2 mb-4">
            <FaCheck className="text-green-500 text-2xl" />
            <h3 className="font-semibold text-lg" style={{ color: colors.text }}>
              Upload Summary
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="font-semibold text-xl" style={{ color: colors.text }}>
                {summary.totalRecords.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Successful</p>
              <p className="font-semibold text-xl text-green-600">
                {summary.successfulRecords.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="font-semibold text-xl text-red-600">
                {summary.failedRecords.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Chunks</p>
              <p className="font-semibold text-xl" style={{ color: colors.text }}>
                {summary.totalChunks}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time Taken</p>
              <p className="font-semibold text-xl" style={{ color: colors.text }}>
                {formatDuration(summary.timeTaken)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Session ID</p>
              <p className="font-semibold text-sm" style={{ color: colors.text }}>
                {summary.sessionId.substring(0, 20)}...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-lg p-6 max-w-6xl w-full max-h-[80vh] overflow-auto"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg" style={{ color: colors.text }}>
                File Preview (First 10 rows)
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {previewData.headers.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewData.rows.map((row, idx) => (
                    <tr key={idx}>
                      {previewData.headers.map((header, colIdx) => (
                        <td
                          key={colIdx}
                          className="px-4 py-2 text-sm"
                          style={{ color: colors.text }}
                        >
                          {row[header] !== undefined && row[header] !== null ? String(row[header]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadChunked;
