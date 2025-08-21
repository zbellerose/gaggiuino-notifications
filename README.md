# ☕ Gaggiuino Notifications

A comprehensive monitoring system for Gaggiuino coffee machines. Features intelligent temperature and uptime monitoring with multi-platform notifications via Discord and SMS.

## 🚀 Features

- **🌡️ Smart Temperature Monitoring**: Notifies when target temperature is reached with configurable variance
- **⏰ Intelligent Uptime Tracking**: Energy-saving alerts when machine runs too long
- **📱 Multi-Platform Notifications**: Discord webhooks + Twilio SMS support
- **🔄 Auto-Restart Monitoring**: Automatically resumes after configurable delays
- **⚡ Adaptive Polling**: Dynamic intervals based on machine online/offline status

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **Coffee machine with API** (e.g., Gaggiuino)
- **Discord account** (for webhook notifications)
- **Twilio account** (optional, for SMS notifications)

## 🛠️ Installation

1. **Clone or download** this repository
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Create environment file**:
   ```bash
   cp env.example .env
   ```

## ⚙️ Configuration

### Environment Variables (`.env` file)

Create a `.env` file in your project root with the following settings:

```bash
# Coffee Machine API
COFFEE_MACHINE_API_URL=http://gaggiuino.local/api/system/status

# Twilio Configuration (Optional - for SMS notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
YOUR_PHONE_NUMBER=+1234567890

# Discord Webhook Configuration
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_id/your_webhook_token
DISCORD_USER_ID=your_discord_user_id_for_mentions

# Notification Settings
DISCORD_ENABLED=true
TWILIO_ENABLED=false

# Temperature Settings
TEMPERATURE_VARIANCE=0.5

# Polling Intervals (in milliseconds)
ONLINE_POLLING_INTERVAL_MS=5000
OFFLINE_POLLING_INTERVAL_MS=30000

# Restart delay after notification (in milliseconds, 30 minutes default)
RESTART_DELAY_MS=1800000

# Startup delay before temperature monitoring (in milliseconds, 2 minutes default)
STARTUP_DELAY_MS=120000

# Maximum uptime before warning (in milliseconds, 45 minutes default)
MAX_UPTIME_MS=2700000

# Enable/disable uptime exceeded notifications
UPTIME_EXCEEDED_ENABLED=true

# Debug Settings
DEBUG=false                    # Set to 'true' for verbose logging
```

### Startup Delay

The `STARTUP_DELAY_MS` setting prevents false temperature notifications during the initial warm-up phase:

- **Default**: 2 minutes (120,000 ms)
- **Purpose**: Avoids notifications from temperature spikes during startup
- **Behavior**: Temperature monitoring begins only after this delay
- **Debug**: Shows countdown when delay is active

## 🔗 Discord Webhook Setup

### Step 1: Create a Discord Webhook

1. **Go to your Discord server**
2. **Server Settings** → **Integrations** → **Webhooks**
3. **Create New Webhook**
4. **Copy the webhook URL** (looks like: `https://discord.com/api/webhooks/123456789/abcdef...`)

### Step 2: Get Your Discord User ID

1. **Enable Developer Mode** in Discord (User Settings → Advanced → Developer Mode)
2. **Right-click your username** → **Copy ID**
3. **Add to `.env`** as `DISCORD_USER_ID`

### Step 3: Configure in `.env`

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_id/your_webhook_token
DISCORD_USER_ID=your_discord_user_id
DISCORD_ENABLED=true
```

## 📱 Twilio SMS Setup (Optional)

### Step 1: Create Twilio Account

1. **Sign up** at [twilio.com](https://www.twilio.com)
2. **Verify your phone number** (required for trial accounts)
3. **Get your credentials** from the Twilio Console

### Step 2: A2P Campaign Approval (Required for Production)

**Important**: Twilio requires A2P (Application-to-Person) campaign approval for production SMS:
1. **Submit campaign details** in Twilio Console
2. **Wait for approval** (can take 1-2 weeks)
3. **Set `TWILIO_ENABLED=false`** until approved

### Step 3: Configure in `.env`

```bash
TWILIO_ACCOUNT_SID=AC1234567890abcdef...
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
YOUR_PHONE_NUMBER=+1234567890
TWILIO_ENABLED=false  # Set to true after A2P approval
```

## 🚀 Usage

### Start Monitoring

```bash
npm start
```

### Start with PM2 (Production)

For production deployments, it's recommended to use PM2 to manage the application process:

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start the application with PM2
pm2 start src/index.js --name "coffee-monitor"

# Start PM2 on system boot
pm2 startup
pm2 save
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm test -- tests/unit/monitoring/temperatureMonitor.test.js
npm test -- tests/unit/monitoring/stateManager.test.js
npm test -- tests/unit/services/

# Run tests with verbose output
npm test -- --verbose

# Run tests in watch mode during development
npm test -- --watch
```

## 📊 How It Works

### 1. **Startup**
- Assumes machine is offline
- Begins with configurable offline polling interval

### 2. **Online Detection**
- Detects when machine responds to API calls
- Switches to faster polling for responsive monitoring

### 3. **Temperature Monitoring**
- Continuously checks temperature vs target
- Uses ±0.5°C variance for accuracy
- Sends notification when target reached

### 4. **Uptime Monitoring**
- Tracks how long machine has been running
- Warns after 45 minutes (configurable)
- Helps save energy

### 5. **Auto-Restart**
- Waits 30 minutes after temperature notification
- Automatically restarts monitoring
- Resets all flags for next brew session

## 🔧 Customization

### Adjust Polling Intervals

```bash
# Responsive monitoring when machine is online
ONLINE_POLLING_INTERVAL_MS=3000    # 3 seconds

# Conservative monitoring when machine is offline
OFFLINE_POLLING_INTERVAL_MS=60000  # 1 minute
```

**Default values:**
- **Online**: 5 seconds (responsive temperature monitoring)
- **Offline**: 30 seconds (conservative resource usage)

### Change Temperature Variance

```bash
# More strict (exact temperature)
TEMPERATURE_VARIANCE=0.1

# More flexible (wider range)
TEMPERATURE_VARIANCE=1.0
```

### Modify Uptime Warning

```bash
# Shorter warning time
MAX_UPTIME_MS=900000    # 15 minutes

# Longer warning time
MAX_UPTIME_MS=3600000   # 1 hour
```

### Adjust Restart Delay

```bash
# Quick restart (for testing)
RESTART_DELAY_MS=60000   # 1 minute

# Longer restart (for multiple brews)
RESTART_DELAY_MS=3600000 # 1 hour
```

## 🐛 Troubleshooting

### Common Issues

1. **Discord notifications not working**
   - Check webhook URL is correct
   - Verify `DISCORD_ENABLED=true`
   - Ensure webhook has permission to send messages

2. **SMS not working**
   - Verify Twilio credentials
   - Check A2P campaign approval status
   - Ensure phone numbers are in correct format (+1234567890)

3. **Machine not detected**
   - Check `COFFEE_MACHINE_API_URL` is correct
   - Verify machine is powered on and accessible
   - Check network connectivity

4. **Duplicate notifications**
   - Ensure only one instance is running
   - Check notification flags are resetting properly

### Debug Mode

Enable detailed logging by setting `DEBUG=true` in your `.env` file. This will show:
- Machine online/offline status
- Temperature readings and variance calculations
- Uptime tracking
- Notification sending status
- Polling interval changes
- Detailed API responses

**Example debug output:**
```
[DEBUG] Current Temp: 85°C, Target Temp: 90°C (Variance: ±0.5°C), Uptime: 15 minutes
[DEBUG] Polling interval changed to 5 seconds
[DEBUG] Coffee machine API is currently offline. Retrying...
```

## 📁 Project Structure

```
coffee-machine-notifier/
├── src/                     # Source code
│   ├── config/             # Configuration management
│   │   ├── constants.js    # Environment variables and constants
│   │   └── index.js        # Config exports
│   ├── monitoring/         # Core monitoring logic
│   │   ├── coffeeMonitor.js      # Main monitoring orchestration
│   │   ├── stateManager.js       # Application state management
│   │   └── temperatureMonitor.js # Temperature and uptime logic
│   ├── services/           # External service integrations
│   │   ├── coffeeApiService.js   # Coffee machine API client
│   │   ├── discordService.js     # Discord webhook notifications
│   │   ├── notificationService.js # Notification orchestration
│   │   └── twilioService.js      # SMS notifications
│   ├── utils/              # Utility functions
│   │   └── logger.js       # Debug logging utilities
│   └── index.js            # Application entry point
├── tests/                  # Test suites
│   ├── unit/               # Unit tests
│   │   ├── monitoring/     # Monitoring logic tests
│   │   ├── services/       # Service integration tests
│   │   └── utils/          # Utility function tests
│   └── setup.js            # Test configuration
├── .env                    # Environment configuration (create this)
├── env.example            # Example environment file
├── package.json           # Dependencies and scripts
├── jest.config.js         # Test configuration
└── README.md              # Documentation
```

### Key Components

- **🎯 Entry Point** (`src/index.js`) - Application startup and lifecycle
- **📡 Coffee Monitor** (`src/monitoring/coffeeMonitor.js`) - Main monitoring logic
- **🏪 State Manager** (`src/monitoring/stateManager.js`) - Application state and intervals
- **🌡️ Temperature Monitor** (`src/monitoring/temperatureMonitor.js`) - Temperature and uptime validation
- **🔔 Notification Service** (`src/services/notificationService.js`) - Multi-platform notification dispatch
- **🌐 API Service** (`src/services/coffeeApiService.js`) - Coffee machine communication
- **⚙️ Configuration** (`src/config/`) - Environment and settings management

## 🔧 Development

### Prerequisites

```bash
# Node.js 14+ required
node --version

# Install dependencies
npm install
```

### Development Workflow

```bash
# Start development with auto-restart
npm run dev

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint

# Format code
npm run format
```

### Adding New Features

1. **Create tests first** - Follow TDD approach
2. **Implement feature** - Keep functions small and focused
3. **Update documentation** - Keep README current
4. **Run full test suite** - Ensure nothing breaks

### Debugging

```bash
# Run with Node.js debugger
node --inspect src/index.js

# Test specific scenarios
npm test -- --grep "temperature monitoring"
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
3. **Write tests** for your changes
4. **Ensure all tests pass** (`npm test`)
5. **Update documentation** if needed
6. **Commit your changes**
7. **Push to the branch**
8. **Open a Pull Request**

### Code Standards

- **📝 Functions should be documented**
- **🎯 Keep functions small and focused**
- **🔄 Follow existing patterns**
- **⚡ Optimize for readability over cleverness**

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Gaggiuino** community for the coffee machine API
- **Discord** for webhook integration
- **Twilio** for SMS capabilities

---

**Happy brewing! ☕✨**
