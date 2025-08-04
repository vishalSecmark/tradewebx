import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import axios from 'axios';
import { BASE_URL, OTP_VERIFICATION_URL, ACTION_NAME } from '@/utils/constants';

// Security configuration
const SECURITY_CONFIG = {
    REQUEST_SIGNATURE_KEY: 'TradeWebX_Security_Key_2024',
    MAX_REQUEST_AGE: 5 * 60 * 1000, // 5 minutes
};

// Validate request signature
function validateRequestSignature(data: any, timestamp: number, signature: string): boolean {
    const payload = JSON.stringify(data) + timestamp + SECURITY_CONFIG.REQUEST_SIGNATURE_KEY;
    const expectedSignature = CryptoJS.SHA256(payload).toString();
    return signature === expectedSignature;
}

// Check if request is not too old (prevent replay attacks)
function isRequestFresh(timestamp: number): boolean {
    const now = Date.now();
    const requestAge = now - timestamp;
    return requestAge <= SECURITY_CONFIG.MAX_REQUEST_AGE;
}

// Validate token with backend service
async function validateTokenWithBackend(token: string): Promise<{
    success: boolean;
    isValid: boolean;
    userData?: any;
    message?: string;
}> {
    try {
        const xmlData = `<dsXml>
            <J_Ui>"ActionName":"${ACTION_NAME}","Option":"ValidateToken","RequestFrom":"W"</J_Ui>
            <Sql></Sql>
            <X_Data>
                <Token>${token}</Token>
            </X_Data>
            <X_Filter></X_Filter>
            <J_Api></J_Api>
        </dsXml>`;

        const response = await axios({
            method: 'post',
            url: BASE_URL + OTP_VERIFICATION_URL,
            data: xmlData,
            headers: {
                'Content-Type': 'application/xml',
            },
            timeout: 10000,
        });

        const data = response.data;
        
        if (data.success && data.data?.rs0) {
            const result = data.data.rs0[0];
            return {
                success: true,
                isValid: result.Flag === 'S',
                userData: {
                    userId: result.UserId,
                    userType: result.UserType,
                    permissions: result.Permissions ? result.Permissions.split(',') : [],
                },
                message: result.Message || 'Token validated successfully'
            };
        } else {
            return {
                success: false,
                isValid: false,
                message: data.message || 'Token validation failed'
            };
        }
    } catch (error) {
        console.error('Backend token validation error:', error);
        return {
            success: false,
            isValid: false,
            message: 'Backend validation failed'
        };
    }
}

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();
        const { token, timestamp, signature } = body;

        // Validate required fields
        if (!token || !timestamp || !signature) {
            return NextResponse.json({
                success: false,
                isValid: false,
                message: 'Missing required fields'
            }, { status: 400 });
        }

        // Validate request signature
        if (!validateRequestSignature({ token }, timestamp, signature)) {
            console.error('Invalid request signature');
            return NextResponse.json({
                success: false,
                isValid: false,
                message: 'Invalid request signature'
            }, { status: 401 });
        }

        // Check if request is fresh (prevent replay attacks)
        if (!isRequestFresh(timestamp)) {
            console.error('Request too old (replay attack)');
            return NextResponse.json({
                success: false,
                isValid: false,
                message: 'Request expired'
            }, { status: 401 });
        }

        // Validate token with backend
        const validationResult = await validateTokenWithBackend(token);

        // Generate response signature
        const responseSignature = CryptoJS.SHA256(
            JSON.stringify(validationResult) + SECURITY_CONFIG.REQUEST_SIGNATURE_KEY
        ).toString();

        // Return response with signature
        const response = NextResponse.json(validationResult);
        response.headers.set('X-Response-Signature', responseSignature);
        
        return response;

    } catch (error) {
        console.error('Token validation API error:', error);
        return NextResponse.json({
            success: false,
            isValid: false,
            message: 'Internal server error'
        }, { status: 500 });
    }
}

// Prevent other HTTP methods
export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 