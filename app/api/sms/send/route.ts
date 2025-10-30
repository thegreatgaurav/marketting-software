import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import axios from 'axios';
import { appendToSheet, ensureSheetTab } from '@/lib/googleSheets';

// Configurable via environment with safe dev fallback
const VERVBRIDGE_API_KEY = process.env.VERVBRIDGE_API_KEY || '';
const SENDER_NUMBER = process.env.SENDER_NUMBER || '';
const VERVBRIDGE_API_URL = process.env.VERVBRIDGE_API_URL || 'https://api.vervbridge.com/v1/send';
const DEV_SMS_MODE = process.env.DEV_SMS_MODE === 'true';
const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '';
// Optional Twilio live provider
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM = process.env.TWILIO_FROM || '';

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

    // Normalize phone if needed
    const toNormalized = normalizePhone(to);

    // Ensure Messages sheet exists
    await ensureSheetTab('Messages', ['To', 'Message', 'Type', 'Status', 'Date', 'Response']);

    // If in dev mode, simulate send for a seamless experience
    if (DEV_SMS_MODE) {
      const date = new Date().toISOString();
      await appendToSheet('Messages', [toNormalized, message, type, 'Sent (Simulated)', date, 'DEV_SMS_MODE']);
      return NextResponse.json({
        success: true,
        message: 'Message sent successfully (simulated)',
        data: { simulated: true },
      });
    }

    // Prefer Twilio if configured
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(TWILIO_ACCOUNT_SID)}/Messages.json`;
        const params = new URLSearchParams();
        params.append('From', TWILIO_FROM);
        params.append('To', toNormalized);
        params.append('Body', message);

        const response = await axios.post(url, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN },
          timeout: 30000,
        });

        const date = new Date().toISOString();
        const status = response.status === 201 || response.status === 200 ? 'Sent' : 'Failed';
        await appendToSheet('Messages', [toNormalized, message, type, status, date, JSON.stringify(response.data)]);
        return NextResponse.json({ success: true, message: 'Message sent successfully', data: response.data });
      } catch (error: any) {
        const date = new Date().toISOString();
        const errorMessage = error.response?.data || error.message || 'Unknown error';
        await appendToSheet('Messages', [toNormalized, message, type, 'Failed', date, JSON.stringify(errorMessage)]);
        return NextResponse.json({ error: 'Failed to send message', details: errorMessage }, { status: 500 });
      }
    }

    // Fallback to VervBridge if configured
    if (VERVBRIDGE_API_KEY && SENDER_NUMBER) {
      try {
        const response = await axios.post(
          VERVBRIDGE_API_URL,
          {
            api_key: VERVBRIDGE_API_KEY,
            from: SENDER_NUMBER,
            to: toNormalized,
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
        const responseStatus = response.data?.status || response.data?.success || '';
        const status = (responseStatus === 'success' || responseStatus === true || response.status === 200) ? 'Sent' : 'Failed';
        await appendToSheet('Messages', [toNormalized, message, type, status, date, JSON.stringify(response.data)]);

        return NextResponse.json({ success: true, message: 'Message sent successfully', data: response.data });
      } catch (error: any) {
        const date = new Date().toISOString();
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        await appendToSheet('Messages', [toNormalized, message, type, 'Failed', date, errorMessage]);
        return NextResponse.json({ error: 'Failed to send message', details: errorMessage }, { status: 500 });
      }
    }

    // As last resort, simulate
    const date = new Date().toISOString();
    await appendToSheet('Messages', [toNormalized, message, type, 'Sent (Simulated)', date, 'NO_PROVIDER_CONFIGURED']);
    return NextResponse.json({ success: true, message: 'Message sent successfully (simulated)', data: { simulated: true } });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);

function normalizePhone(input: string): string {
  const trimmed = String(input).trim();
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('00')) return `+${trimmed.slice(2)}`;
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (DEFAULT_COUNTRY_CODE && /^\d{10}$/.test(digits)) {
    return `+${DEFAULT_COUNTRY_CODE}${digits}`;
  }
  // If already includes country code without plus, add plus
  if (DEFAULT_COUNTRY_CODE && digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    return `+${digits}`;
  }
  // Fallback: add plus if missing and looks like intl number
  return digits.length > 0 && !trimmed.startsWith('+') ? `+${digits}` : trimmed;
}
