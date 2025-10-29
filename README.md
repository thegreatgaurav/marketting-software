# Marketing Software

A Next.js application for managing leads, media files, and sending WhatsApp/SMS messages. Uses Google Sheets as the database, Google Drive for file storage, and VervBridge API for messaging.

## Features

- **Public Marketing Site**: Home, About, Services, and Contact pages
- **Admin Dashboard**: Secure login with JWT authentication
- **Lead Management**: Store and view leads from contact forms
- **Media Management**: Upload, view, and delete files stored in Google Drive
- **Messaging**: Send WhatsApp and SMS messages via VervBridge API
- **Google Sheets Integration**: All data stored in Google Sheets with automatic sheet/tab creation

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Google Sheets API**
- **Google Drive API**
- **VervBridge API**
- **JWT Authentication**

## Prerequisites

1. Node.js 18+ installed
2. A Google Cloud Project with:
   - Google Sheets API enabled
   - Google Drive API enabled
   - A service account created with credentials
3. Access to VervBridge API (API key provided)

## Setup Instructions

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google Sheets API** and **Google Drive API**
4. Go to **IAM & Admin > Service Accounts**
5. Create a new service account
6. Download the service account key as JSON
7. **Important**: Copy the service account email (e.g., `your-service-account@project-id.iam.gserviceaccount.com`)

### 2. Google Sheet & Drive Permissions

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1vEh5dvyWBTRQvYKP8eT3ozBaX6V89L0DQ0JXr3nOM4c/edit
2. Click **Share** button
3. Add the service account email with **Editor** permissions
4. Open Google Drive and navigate to folder ID: `1o9678grxPaJDHPsB3qPirt0YtSoOkQLP`
5. Share this folder with the service account email with **Editor** permissions

> **Note**: If you get permission errors, make sure you've shared both the Google Sheet and Drive folder with the service account email.

### 3. Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in:
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: Paste the entire JSON content from your service account key file (as a single-line string or properly escaped JSON)
   - `JWT_SECRET`: Generate a secure random string (e.g., `openssl rand -base64 32`)
   - `ADMIN_USERNAME`: Your preferred admin username
   - `ADMIN_PASSWORD`: Your preferred admin password (will be hashed)

   **Example format for GOOGLE_SERVICE_ACCOUNT_KEY:**
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
   ```

   Or if you prefer a more readable format, you can use a JSON file and reference it (requires code modification).

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `GOOGLE_SERVICE_ACCOUNT_KEY`
   - `JWT_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
4. Deploy!

### Important Notes for Vercel Deployment

- For `GOOGLE_SERVICE_ACCOUNT_KEY`, you may need to escape newlines or put the entire JSON on a single line
- In Vercel's environment variables, you can use `\n` for line breaks if needed
- Alternatively, base64 encode the JSON and decode it in your code

## API Endpoints

### Public
- `POST /api/leads/create` - Create a new lead from contact form

### Admin (Requires Authentication)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/leads/list` - Get all leads
- `GET /api/media/list` - List all media files
- `POST /api/media/upload` - Upload a file
- `POST /api/media/delete` - Delete a file
- `POST /api/sms/send` - Send SMS/WhatsApp message

## Google Sheets Structure

The app automatically creates the following tabs in your Google Sheet:

1. **Leads**: Name, Email, Phone, Message, Date, Status
2. **Media**: Name, File ID, URL, Size, Type, Upload Date
3. **Messages**: To, Message, Type, Status, Date, Response

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── admin/        # Admin authentication
│   │   ├── leads/        # Lead management
│   │   ├── media/        # Media management
│   │   └── sms/          # SMS/WhatsApp sending
│   ├── admin/            # Admin dashboard pages
│   ├── about/            # About page
│   ├── services/         # Services page
│   ├── contact/          # Contact page
│   └── page.tsx          # Home page
├── lib/                  # Utility functions
│   ├── auth.ts          # Authentication helpers
│   ├── googleSheets.ts  # Google Sheets integration
│   ├── googleDrive.ts   # Google Drive integration
│   └── middleware.ts    # Auth middleware
└── public/              # Static assets
```

## Default Credentials

After first setup, use:
- Username: `admin` (or your `ADMIN_USERNAME`)
- Password: `admin123` (or your `ADMIN_PASSWORD`)

**Change these in production!**

## Troubleshooting

### Permission Errors

If you see errors like "The caller does not have permission" or "Request had insufficient authentication scopes":

1. Verify the service account email is shared with both:
   - The Google Sheet (with Editor access)
   - The Google Drive folder (with Editor access)
2. Ensure the service account has the correct IAM roles in Google Cloud Console
3. Check that Google Sheets API and Google Drive API are enabled

### VervBridge API Errors

- Verify the API key is correct
- Check that the sender number format is correct (country code + number)
- Ensure your VervBridge account has sufficient credits

### Environment Variable Issues

- Make sure `.env.local` exists (not just `.env.example`)
- Verify all required variables are set
- For `GOOGLE_SERVICE_ACCOUNT_KEY`, ensure the JSON is properly formatted/escaped

## License

MIT

## Support

For issues related to:
- **Google APIs**: Check Google Cloud Console and ensure all APIs are enabled
- **VervBridge**: Contact VervBridge support
- **App Issues**: Check the browser console and server logs for detailed error messages
