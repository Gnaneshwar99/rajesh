# Yoom - Video Conferencing Platform

A comprehensive Zoom clone built with Next.js and TypeScript, enabling secure video conferencing with advanced meeting features.

## Features

- **Authentication**: Secure user authentication via Clerk
- **Real-time Video Conferencing**: Powered by Stream Video SDK
- **Meeting Management**:
  - Create instant meetings
  - Schedule future meetings
  - Join via meeting links
  - Personal meeting rooms
- **Advanced Meeting Controls**:
  - Camera/microphone toggle
  - Screen sharing
  - Meeting recording
  - Participant management
  - Grid layout options
  - Emoji reactions
- **Live Captions/Subtitles**:
  - Real-time speech-to-text during meetings
  - Support for multiple languages
  - Toggle captions on/off
  - Select preferred caption language
- **Meeting History**:
  - View past meetings
  - Access meeting recordings
  - Manage upcoming meetings

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Video SDK**: Stream Video
- **Speech Recognition**: Web Speech API
- **UI Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Clerk account
- Stream account
- Google AI API key (for caption translation)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/yoom.git
   cd yoom
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_STREAM_API_KEY=
   STREAM_SECRET_KEY=
   GOOGLE_AI_API_KEY=your-google-api-key-here
   ```
   - Get a Clerk account from [clerk.com](https://clerk.com) for authentication
   - Get a Stream account from [getstream.io](https://getstream.io) for video
   - Get a Google API key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) for translations

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setting Up Caption Translation

The captions feature uses Google's Gemini AI for high-quality translations:

1. **Google Gemini AI API** (powerful AI-driven translation):
   - Get a Google AI API key from the [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add the key to your `.env.local` file as `GOOGLE_AI_API_KEY`
   - The Gemini model will provide context-aware, high-quality translations
   - Supports nuanced translations across multiple languages

2. **Basic Phrase Translation** (automatic fallback):
   - Automatically used when the Gemini API is unavailable
   - Provides basic translation for common phrases and words
   - No additional setup required

## Troubleshooting Caption Translation

If captions are not appearing in your selected language:

1. Check for different translation indicators:
   - "Translated by Gemini AI" - The AI-powered translation is working
   - "Using basic phrase translation" - Falling back to built-in dictionary
   - Any error messages will be displayed in the captions area

2. To enable the Gemini AI translation:
   - Make sure your Google AI API key is correctly set in `.env.local` or `next.config.mjs`
   - The key should be from the [Google AI Studio](https://makersuite.google.com/app/apikey)
   - No additional API enablement is needed (unlike the Cloud Translation API)

3. If you're experiencing issues:
   - Check the browser console for specific error messages
   - Verify your API key is valid
   - Ensure you have an active internet connection
   - The system will automatically fall back to basic translation if needed

## Using Caption Features

1. Join a meeting
2. Click the "CC" button in the controls bar at the bottom
3. Choose your preferred language from the dropdown menu
4. Speak clearly for better recognition quality
5. Note: Speech recognition works best in Chrome, Edge, and Safari browsers

## Project Structure

- `app/` - Next.js app router files
- `components/` - Reusable UI components
- `providers/` - React context providers
- `lib/` - Utility functions
- `actions/` - Server actions
- `public/` - Static assets

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.dev/)
- [Stream](https://getstream.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
