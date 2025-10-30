import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import axios from 'axios';
import { appendToSheet, ensureSheetTab } from '@/lib/googleSheets';

// WhatsApp API configuration via environment variables
const WA_API_KEY = process.env.WA_API_KEY;
const WA_SENDER_NUMBER = process.env.WA_SENDER_NUMBER;
const WA_API_ENDPOINT = process.env.WA_API_ENDPOINT || 'https://wa.vervebridge.in/send-message';

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, message, type = 'whatsapp' } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Ensure Messages sheet exists
    await ensureSheetTab('Messages', ['To', 'Message', 'Type', 'Status', 'Date', 'Response']);

    // Validate server configuration
    if (!WA_API_KEY || !WA_SENDER_NUMBER) {
      return NextResponse.json(
        { error: 'Server not configured: WA_API_KEY or WA_SENDER_NUMBER missing' },
        { status: 500 }
      );
    }

    try {
      // Send via configured WhatsApp API
      const response = await axios.post(
        WA_API_ENDPOINT,
        {
          api_key: WA_API_KEY,
          from: WA_SENDER_NUMBER,
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
