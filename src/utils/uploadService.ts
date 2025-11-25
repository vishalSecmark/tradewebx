import { ChunkData, ChunkResult } from '@/types/upload';

/**
 * Convert data rows to the required payload format
 * Headers should be a comma-separated string from the first row keys
 * Each data row should be converted to a comma-separated string value
 */
const buildPayload = (chunkData: ChunkData, headers: string[], metadata?: any) => {
  const { chunkIndex, data } = chunkData;

  // Build InputJson object
  const inputJson: any = {
    Header: headers.join(','),
  };

  // Convert each data row to comma-separated string
  data.forEach((row, index) => {
    const lineNumber = index + 1;
    const lineValues = headers.map(header => {
      const value = row[header];
      return value !== undefined && value !== null ? String(value) : '';
    });
    inputJson[`Line${lineNumber}`] = lineValues.join(',');
  });

  return {
    FileSeqNo: "2", // Always 1 as per requirement
    UserId: "Admin",
    BatchNo: String(chunkIndex + 1), // Increments with each chunk
    InputJson: inputJson,
    X_Filter: metadata?.filters || {},
    SelectedRecord: metadata?.selectedRecord || {},
  };
};

/**
 * Upload a single chunk to the API
 */
export const uploadChunk = async (
  chunkData: ChunkData,
  apiEndpoint: string,
  headers: string[] = [],
  onProgress?: (progress: number) => void,
  metadata?: any
): Promise<ChunkResult> => {
  try {
    const payload = buildPayload(chunkData, headers, metadata);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Get response data
    const result = await response.json();

    // Check if response is not ok (HTTP error)
    if (!response.ok) {
      const errorMessage = result.data || result.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Check if the API returned status: false (business logic error)
    if (result.status === false) {
      const errorMessage = result.data || result.message || 'Unknown API error';
      throw new Error(errorMessage);
    }

    // Success case
    return {
      chunkIndex: chunkData.chunkIndex,
      success: true,
      recordsProcessed: chunkData.data.length,
      retryCount: 0,
    };
  } catch (error: any) {
    return {
      chunkIndex: chunkData.chunkIndex,
      success: false,
      error: error.message || 'Unknown error',
      recordsProcessed: 0,
      retryCount: 0,
    };
  }
};

/**
 * Upload chunk with retry logic
 */
export const uploadChunkWithRetry = async (
  chunkData: ChunkData,
  apiEndpoint: string,
  headers: string[] = [],
  maxRetries: number = 3,
  retryDelay: number = 1000,
  metadata?: any
): Promise<ChunkResult> => {
  let lastError: string = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await uploadChunk(chunkData, apiEndpoint, headers, undefined, metadata);

      if (result.success) {
        return {
          ...result,
          retryCount: attempt,
        };
      }

      lastError = result.error || 'Upload failed';

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        await delay(retryDelay * Math.pow(2, attempt));
      }
    } catch (error: any) {
      lastError = error.message || 'Unknown error';

      // Wait before retry
      if (attempt < maxRetries - 1) {
        await delay(retryDelay * Math.pow(2, attempt));
      }
    }
  }

  // All retries failed
  return {
    chunkIndex: chunkData.chunkIndex,
    success: false,
    error: lastError,
    recordsProcessed: 0,
    retryCount: maxRetries,
  };
};

/**
 * Upload multiple chunks sequentially with delay
 */
export const uploadChunksSequentially = async (
  chunks: ChunkData[],
  apiEndpoint: string,
  headers: string[] = [],
  delayBetweenChunks: number = 100,
  maxRetries: number = 3,
  onProgress?: (result: ChunkResult, currentIndex: number, total: number) => void,
  onChunkComplete?: (result: ChunkResult) => void,
  shouldContinue?: () => boolean,
  metadata?: any
): Promise<ChunkResult[]> => {
  const results: ChunkResult[] = [];

  for (let i = 0; i < chunks.length; i++) {
    // Check if upload should continue (for pause/cancel functionality)
    if (shouldContinue && !shouldContinue()) {
      break;
    }

    const chunk = chunks[i];
    const result = await uploadChunkWithRetry(chunk, apiEndpoint, headers, maxRetries, 1000, metadata);

    results.push(result);

    if (onChunkComplete) {
      onChunkComplete(result);
    }

    if (onProgress) {
      onProgress(result, i + 1, chunks.length);
    }

    // Add delay between chunks (except for last chunk)
    if (i < chunks.length - 1 && delayBetweenChunks > 0) {
      await delay(delayBetweenChunks);
    }
  }

  return results;
};

/**
 * Upload chunks in parallel (use with caution for large files)
 */
export const uploadChunksParallel = async (
  chunks: ChunkData[],
  apiEndpoint: string,
  headers: string[] = [],
  maxRetries: number = 3,
  concurrency: number = 5,
  onProgress?: (result: ChunkResult, completedCount: number, total: number) => void
): Promise<ChunkResult[]> => {
  const results: ChunkResult[] = [];
  let completedCount = 0;

  // Process chunks in batches to limit concurrency
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);

    const batchPromises = batch.map(chunk =>
      uploadChunkWithRetry(chunk, apiEndpoint, headers, maxRetries)
    );

    const batchResults = await Promise.all(batchPromises);

    results.push(...batchResults);
    completedCount += batchResults.length;

    if (onProgress) {
      batchResults.forEach(result => {
        onProgress(result, completedCount, chunks.length);
      });
    }
  }

  return results;
};

/**
 * Retry failed chunks
 */
export const retryFailedChunks = async (
  failedChunks: ChunkData[],
  apiEndpoint: string,
  headers: string[] = [],
  maxRetries: number = 3,
  delayBetweenChunks: number = 100,
  onProgress?: (result: ChunkResult, currentIndex: number, total: number) => void
): Promise<ChunkResult[]> => {
  return uploadChunksSequentially(
    failedChunks,
    apiEndpoint,
    headers,
    delayBetweenChunks,
    maxRetries,
    onProgress
  );
};

/**
 * Delay utility function
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate upload statistics
 */
export const calculateUploadStats = (results: ChunkResult[]): {
  totalChunks: number;
  successfulChunks: number;
  failedChunks: number;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
} => {
  const totalChunks = results.length;
  const successfulChunks = results.filter(r => r.success).length;
  const failedChunks = results.filter(r => !r.success).length;

  const totalRecords = results.reduce((sum, r) => sum + r.recordsProcessed, 0);
  const successfulRecords = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.recordsProcessed, 0);
  const failedRecords = totalRecords - successfulRecords;

  return {
    totalChunks,
    successfulChunks,
    failedChunks,
    totalRecords,
    successfulRecords,
    failedRecords,
  };
};

/**
 * Validate API endpoint
 */
export const validateApiEndpoint = (endpoint: string): boolean => {
  try {
    new URL(endpoint);
    return true;
  } catch {
    return false;
  }
};

/**
 * Create chunk data from array
 */
export const createChunks = (
  data: any[],
  chunkSize: number,
  sessionId: string
): ChunkData[] => {
  const chunks: ChunkData[] = [];
  const totalChunks = Math.ceil(data.length / chunkSize);

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunkData = data.slice(i, i + chunkSize);
    const chunkIndex = Math.floor(i / chunkSize);

    chunks.push({
      chunkIndex,
      data: chunkData,
      sessionId,
      totalChunks,
      startIndex: i,
      endIndex: Math.min(i + chunkSize, data.length),
    });
  }

  return chunks;
};
