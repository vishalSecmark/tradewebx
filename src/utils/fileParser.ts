import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ParsedData, FileMetadata } from '@/types/upload';

/**
 * Get file metadata
 */
export const getFileMetadata = (file: File): FileMetadata => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    extension,
  };
};

/**
 * Validate file before processing
 */
export const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } => {
  const metadata = getFileMetadata(file);

  if (!allowedTypes.includes(metadata.extension)) {
    return {
      valid: false,
      error: `File type .${metadata.extension} is not supported. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
};

/**
 * Parse CSV file using streaming (Papa.parse with step callback)
 * This prevents loading entire file into memory
 */
export const parseCSVStream = (
  file: File,
  onData: (chunk: any[], headers: string[]) => void,
  onComplete: (totalRows: number) => void,
  onError: (error: Error) => void,
  chunkSize: number = 5000
): { abort: () => void } => {
  let headers: string[] = [];
  let buffer: any[] = [];
  let totalRows = 0;
  let isFirstRow = true;
  let aborted = false;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    step: (results: any, parser: any) => {
      if (aborted) {
        parser.abort();
        return;
      }

      // Extract headers from first row
      if (isFirstRow && results.meta?.fields) {
        headers = results.meta.fields;
        isFirstRow = false;
      }

      // Add row to buffer
      if (results.data) {
        buffer.push(results.data);
        totalRows++;

        // When buffer reaches chunk size, send it
        if (buffer.length >= chunkSize) {
          onData([...buffer], headers);
          buffer = [];
        }
      }
    },
    complete: () => {
      if (aborted) return;
      // Send remaining buffer
      if (buffer.length > 0) {
        onData([...buffer], headers);
      }
      onComplete(totalRows);
    },
    error: (error: Error) => {
      if (aborted) return;
      onError(error);
    },
  });

  return {
    abort: () => {
      aborted = true;
    },
  };
};

/**
 * Parse TXT file (similar to CSV but with different delimiter)
 */
export const parseTXTStream = (
  file: File,
  onData: (chunk: any[], headers: string[]) => void,
  onComplete: (totalRows: number) => void,
  onError: (error: Error) => void,
  chunkSize: number = 5000,
  delimiter: string = '\t'
): { abort: () => void } => {
  let headers: string[] = [];
  let buffer: any[] = [];
  let totalRows = 0;
  let isFirstRow = true;
  let aborted = false;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    delimiter: delimiter,
    step: (results: any, parser: any) => {
      if (aborted) {
        parser.abort();
        return;
      }

      if (isFirstRow && results.meta?.fields) {
        headers = results.meta.fields;
        isFirstRow = false;
      }

      if (results.data) {
        buffer.push(results.data);
        totalRows++;

        if (buffer.length >= chunkSize) {
          onData([...buffer], headers);
          buffer = [];
        }
      }
    },
    complete: () => {
      if (aborted) return;
      if (buffer.length > 0) {
        onData([...buffer], headers);
      }
      onComplete(totalRows);
    },
    error: (error: Error) => {
      if (aborted) return;
      onError(error);
    },
  });

  return {
    abort: () => {
      aborted = true;
    },
  };
};

/**
 * Parse Excel file in chunks
 * For large files, this should be called in a Web Worker
 */
export const parseExcelInChunks = async (
  file: File,
  onChunk: (chunk: any[], headers: string[], progress: number) => void,
  chunkSize: number = 5000,
  sheetName?: string
): Promise<{ totalRows: number; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first sheet or specified sheet
        const sheet = sheetName
          ? workbook.Sheets[sheetName]
          : workbook.Sheets[workbook.SheetNames[0]];

        if (!sheet) {
          reject(new Error(`Sheet ${sheetName || 'first sheet'} not found`));
          return;
        }

        // Convert sheet to JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
        });

        if (jsonData.length === 0) {
          reject(new Error('No data found in Excel file'));
          return;
        }

        // First row is headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);

        // Send data in chunks
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);

          // Convert array rows to objects with headers
          const chunkObjects = chunk.map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] !== undefined ? row[index] : '';
            });
            return obj;
          });

          const progress = Math.round(((i + chunk.length) / rows.length) * 100);
          onChunk(chunkObjects, headers, progress);
        }

        resolve({ totalRows: rows.length, headers });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format time duration
 */
export const formatDuration = (seconds: number): string => {
  // Handle invalid values (NaN, Infinity, negative, etc.)
  if (!isFinite(seconds) || seconds < 0 || isNaN(seconds)) {
    return 'Calculating...';
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
};

/**
 * Generate unique session ID
 */
export const generateSessionId = (): string => {
  return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Download data as CSV
 */
export const downloadAsCSV = (data: any[], filename: string): void => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get preview of data (first N rows)
 */
export const getDataPreview = async (
  file: File,
  rowCount: number = 10
): Promise<{ headers: string[]; preview: any[] }> => {
  const metadata = getFileMetadata(file);

  if (metadata.extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        preview: rowCount,
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            preview: results.data,
          });
        },
        error: (error) => reject(error),
      });
    });
  } else if (metadata.extension === 'txt') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        preview: rowCount,
        delimiter: '\t',
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            preview: results.data,
          });
        },
        error: (error) => reject(error),
      });
    });
  } else if (['xls', 'xlsx'].includes(metadata.extension)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: '',
          });

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1, rowCount + 1);

          const preview = rows.map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] !== undefined ? row[index] : '';
            });
            return obj;
          });

          resolve({ headers, preview });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  return Promise.reject(new Error('Unsupported file type'));
};
