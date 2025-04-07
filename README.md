# Poker Cash Flow

A comprehensive poker game management application built with React and Vite. Track games, manage players, handle transactions, and automate notifications for your poker sessions.

## Features

- 🎮 Session Management
  - Create and manage poker sessions
  - Track buy-ins and cash-outs
  - Real-time balance tracking
  - Session status management (registration, active, completed)

- 👥 Player Management
  - Player profiles with contact information
  - Performance statistics and rankings
  - Win/loss tracking
  - Historical performance graphs

- 💰 Transaction Handling
  - Easy buy-in and cash-out recording
  - Transaction history
  - Balance tracking per player
  - Session limits enforcement

- 📊 Statistics & Analytics
  - Player performance metrics
  - Session statistics
  - Earnings progression charts
  - Win rate calculations

- 📧 Notifications System
  - Email notifications for upcoming games
  - SMS notifications (optional)
  - WhatsApp notifications (optional)
  - Configurable notification timing
  - Customizable message templates

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (v4 or higher)
- SMTP server or email service provider
- Twilio account (for SMS and WhatsApp, optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/PokerCashFlow.git
   cd PokerCashFlow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Notifications Setup

The application supports three types of notifications:

1. Email Notifications (SMTP)
   - Requires valid SMTP credentials
   - Supports any SMTP server (Gmail, Outlook, custom SMTP)
   - Configure in `.env` using SMTP settings

2. SMS Notifications (via Twilio)
   - Requires Twilio account
   - Set up Twilio credentials in `.env`
   - Optional feature

3. WhatsApp Notifications (via Twilio)
   - Requires Twilio account with WhatsApp capability
   - Set up Twilio credentials in `.env`
   - Optional feature

#### Email Setup

1. Choose your email provider (e.g., Gmail)
2. If using Gmail:
   - Enable 2-factor authentication
   - Generate an App Password
   - Use these credentials in `.env`

#### SMS and WhatsApp Setup (Optional)

1. Create a Twilio account at [Twilio](https://www.twilio.com)
2. Get your Account SID and Auth Token
3. Get a Twilio phone number
4. For WhatsApp:
   - Enable WhatsApp in your Twilio account
   - Follow Twilio's WhatsApp sandbox instructions

## API Endpoints

### Notification Endpoints

```bash
# Email Notifications
POST /api/notifications/email
{
  "to": "recipient@example.com",
  "subject": "Game Reminder",
  "body": "Your game starts soon!"
}

# SMS Notifications
POST /api/notifications/sms
{
  "to": "+1234567890",
  "body": "Your game starts in 2 hours!"
}

# WhatsApp Notifications
POST /api/notifications/whatsapp
{
  "to": "+1234567890",
  "body": "Your game starts in 2 hours!"
}
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Configuration

### Game Settings

Configure game rules in the Settings page:
- Blind amounts
- Buy-in limits
- Player limits
- Session limits
- Contact information
- Notification preferences

### Environment Variables

#### Client-side Variables
- `VITE_API_BASE_URL`: Base URL for API endpoints


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For support, please contact us at [your-email@example.com]

## License

This project is licensed under the MIT License - see the LICENSE file for details