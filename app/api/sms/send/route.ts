import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import axios from 'axios';
import { appendToSheet, ensureSheetTab } from '@/lib/googleSheets';

// Configurable via environment with safe dev fallback
const VERVBRIDGE_API_KEY = process.env.VERVBRIDGE_API_KEY || '';
const SENDER_NUMBER = process.env.SENDER_NUMBER || '';
const VERVBRIDGE_API_URL = process.env.VERVBRIDGE_API_URL || 'https://api.vervbridge.com/v1/send';
const DEV_SMS_MODE = process.env.DEV_SMS_MODE === 'true';

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, message, type = 'sms' } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Ensure Messages sheet exists
    await ensureSheetTab('Messages', ['To', 'Message', 'Type', 'Status', 'Date', 'Response']);

    // If in dev mode or credentials missing, simulate send for a seamless experience
    if (DEV_SMS_MODE || !VERVBRIDGE_API_KEY || !SENDER_NUMBER) {
      const date = new Date().toISOString();
      await appendToSheet('Messages', [to, message, type, 'Sent (Simulated)', date, 'DEV_SMS_MODE']);
      return NextResponse.json({
        success: true,
        message: 'Message sent successfully (simulated)',
        data: { simulated: true },
      });
    }

    try {
      // Send via VervBridge API
      const response = await axios.post(
        VERVBRIDGE_API_URL,
        {
          api_key: VERVBRIDGE_API_KEY,
          from: SENDER_NUMBER,
          to: to,
          message: message,
          type: type, // 'sms' or 'whatsapp'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      const date = new Date().toISOString();
      // VervBridge might return different status formats, handle multiple cases
      const responseStatus = response.data?.status || response.data?.success || '';
      const status = (responseStatus === 'success' || responseStatus === true || response.status === 200) ? 'Sent' : 'Failed';
      
      // Log message to sheet
      await appendToSheet('Messages', [
        to,
        message,
        type,
        status,
        date,
        JSON.stringify(response.data),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Message sent successfully',
        data: response.data,
      });
    } catch (error: any) {
      const date = new Date().toISOString();
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      // Log failed message to sheet
      await appendToSheet('Messages', [
        to,
        message,
        type,
        'Failed',
        date,
        errorMessage,
      ]);

      return NextResponse.json(
        { error: 'Failed to send message', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
