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
  - Configurable notification timing
  - Customizable email templates
  - Support for future SMS and WhatsApp integration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

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

3. Create a `.env` file in the root directory:
   ```env
   # API Configuration
   VITE_API_BASE_URL="http://localhost:3000/api"

   # EmailJS Configuration (for email notifications)
   VITE_EMAILJS_SERVICE_ID="your_service_id"
   VITE_EMAILJS_TEMPLATE_ID="your_template_id"
   VITE_EMAILJS_PUBLIC_KEY="your_public_key"
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Email Notifications Setup

To enable email notifications:

1. Sign up for a free account at [EmailJS](https://www.emailjs.com/)
2. Create an Email Service:
   - Go to EmailJS dashboard
   - Click "Add New Service"
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the setup instructions

3. Create an Email Template:
   - Go to "Email Templates"
   - Click "Create New Template"
   - Use these template variables:
     ```
     To: {{to_email}}
     Name: {{to_name}}
     Subject: {{subject}}
     Message: {{message}}
     ```

4. Update your `.env` file with your EmailJS credentials:
   - Service ID from "Email Services"
   - Template ID from "Email Templates"
   - Public Key from "Account" → "API Keys"

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

- `VITE_API_BASE_URL`: Base URL for API endpoints
- `VITE_EMAILJS_SERVICE_ID`: EmailJS service ID
- `VITE_EMAILJS_TEMPLATE_ID`: EmailJS template ID
- `VITE_EMAILJS_PUBLIC_KEY`: EmailJS public key

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