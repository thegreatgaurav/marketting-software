import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import axios from 'axios';
import { appendToSheet, ensureSheetTab } from '@/lib/googleSheets';

const WA_API_KEY = process.env.WA_API_KEY;
const WA_SENDER_NUMBER = process.env.WA_SENDER_NUMBER;
const WA_API_ENDPOINT = process.env.WA_API_ENDPOINT || 'https://wa.vervebridge.in/send-message';

async function sendOne(to: string, message: string, type: string) {
  const response = await axios.post(
    WA_API_ENDPOINT,
    {
      api_key: WA_API_KEY,
      from: WA_SENDER_NUMBER,
      to,
      message,
      type,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    }
  );
  return response;
}

async function handler(req: NextRequest) {
  try {
    const { toNumbers, message, type = 'whatsapp' } = await req.json();

    if (!Array.isArray(toNumbers) || toNumbers.length === 0 || !message) {
      return NextResponse.json(
        { error: 'toNumbers[] and message are required' },
        { status: 400 }
      );
    }

    if (!WA_API_KEY || !WA_SENDER_NUMBER) {
      return NextResponse.json(
        { error: 'Server not configured: WA_API_KEY or WA_SENDER_NUMBER missing' },
        { status: 500 }
      );
    }

    await ensureSheetTab('Messages', ['To', 'Message', 'Type', 'Status', 'Date', 'Response']);

    const results: Array<{ to: string; status: 'Sent' | 'Failed'; details?: any }> = [];

    for (const to of toNumbers) {
      try {
        const response = await sendOne(to, message, type);
        const date = new Date().toISOString();
        const responseStatus = (response.data?.status ?? response.data?.success ?? '') as any;
        const status: 'Sent' | 'Failed' = (responseStatus === 'success' || responseStatus === true || response.status === 200)
          ? 'Sent' : 'Failed';

        await appendToSheet('Messages', [to, message, type, status, date, JSON.stringify(response.data)]);
        results.push({ to, status, details: response.data });
      } catch (error: any) {
        const date = new Date().toISOString();
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        await appendToSheet('Messages', [to, message, type, 'Failed', date, errorMessage]);
        results.push({ to, status: 'Failed', details: errorMessage });
      }
    }

    const summary = {
      total: toNumbers.length,
      sent: results.filter((r) => r.status === 'Sent').length,
      failed: results.filter((r) => r.status === 'Failed').length,
    };

    return NextResponse.json({ success: true, summary, results });
  } catch (error: any) {
    console.error('Error sending bulk messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send bulk messages' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
