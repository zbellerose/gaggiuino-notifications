# ☕ Gaggiuino Notifications

A smart notification system that monitors your gaggiuino enabled coffee machine's temperature and uptime, sending alerts via Discord webhooks and SMS when your coffee is ready or when the machine has been running too long.

## 🚀 Features

- **🌡️ Temperature Monitoring**: Notifies you when your coffee machine reaches target temperature (±0.5°C variance)
- **⏰ Uptime Monitoring**: Warns you if the machine runs longer than a configurable threshold to save energy
- **📱 Multi-Platform Notifications**: Discord webhooks + Twilio SMS
- **🔄 Auto-Restart**: Automatically restarts monitoring after a configurable delay
- **⚡ Smart Polling**: Configurable intervals that adapt to machine status
- **🧪 Testing Suite**: Comprehensive testing without needing the actual machine

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
node notification.js
```

### Run Tests

```bash
node test-notifications.js
```

## 🧪 Testing

The system includes a comprehensive testing suite that simulates coffee machine scenarios:

- **Temperature monitoring** - Test target temperature detection
- **Uptime monitoring** - Test uptime warning notifications
- **Discord integration** - Test webhook notifications
- **SMS integration** - Test Twilio notifications (when enabled)
- **Full brew cycle** - Simulate complete brewing process

### Test Commands

```javascript
// In the test environment
setSimulatedTemperature(85)     // Set temperature to 85°C
setSimulatedTarget(90)          // Set target to 90°C
setSimulatedUptime(50)          // Set uptime to 50 minutes
setSimulatedOnline(true)        // Set machine online
resetAllFlags()                  // Reset notification flags
showSimulatedStatus()            // Show current status
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

## 📁 File Structure

```
coffee-machine-notifier/
├── notification.js          # Main monitoring application
├── test-notifications.js    # Testing suite
├── .env                     # Environment configuration (create this)
├── env.example             # Example environment file
├── package.json            # Node.js dependencies
└── README.md               # This file
```

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the system!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Gaggiuino** community for the coffee machine API
- **Discord** for webhook integration
- **Twilio** for SMS capabilities

---

**Happy brewing! ☕✨**
