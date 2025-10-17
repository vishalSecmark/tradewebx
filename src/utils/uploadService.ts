import { ChunkData, ChunkResult } from '@/types/upload';

/**
 * Upload a single chunk to the API
 */
export const uploadChunk = async (
  chunkData: ChunkData,
  apiEndpoint: string,
  onProgress?: (progress: number) => void
): Promise<ChunkResult> => {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: chunkData.sessionId,
        chunkIndex: chunkData.chunkIndex,
        totalChunks: chunkData.totalChunks,
        data: chunkData.data,
        startIndex: chunkData.startIndex,
        endIndex: chunkData.endIndex,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

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
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<ChunkResult> => {
  let lastError: string = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await uploadChunk(chunkData, apiEndpoint);

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
  delayBetweenChunks: number = 100,
  maxRetries: number = 3,
  onProgress?: (result: ChunkResult, currentIndex: number, total: number) => void,
  onChunkComplete?: (result: ChunkResult) => void,
  shouldContinue?: () => boolean
): Promise<ChunkResult[]> => {
  const results: ChunkResult[] = [];

  for (let i = 0; i < chunks.length; i++) {
    // Check if upload should continue (for pause/cancel functionality)
    if (shouldContinue && !shouldContinue()) {
      break;
    }

    const chunk = chunks[i];
    const result = await uploadChunkWithRetry(chunk, apiEndpoint, maxRetries);

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
      uploadChunkWithRetry(chunk, apiEndpoint, maxRetries)
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
  maxRetries: number = 3,
  delayBetweenChunks: number = 100,
  onProgress?: (result: ChunkResult, currentIndex: number, total: number) => void
): Promise<ChunkResult[]> => {
  return uploadChunksSequentially(
    failedChunks,
    apiEndpoint,
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
