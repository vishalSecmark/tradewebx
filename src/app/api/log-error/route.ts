import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, method, requestData, error, timestamp } = body;

        const logEntry = `
--------------------------------------------------------------------------------
Timestamp: ${new Date(timestamp).toISOString()}
URL: ${url}
Method: ${method}
Request Data: ${JSON.stringify(requestData, null, 2)}
Error: ${JSON.stringify(error, null, 2)}
--------------------------------------------------------------------------------
`;

        const logDir = path.join(process.cwd(), 'logs');
        const logFile = path.join(logDir, 'api-errors.log');

        // Ensure logs directory exists
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Append to log file
        fs.appendFileSync(logFile, logEntry);

        return NextResponse.json({ success: true, message: 'Error logged successfully' });
    } catch (err) {
        console.error('Failed to log error:', err);
        return NextResponse.json({ success: false, message: 'Failed to log error' }, { status: 500 });
    }
}
