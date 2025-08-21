// Import the actual notification functions and config from notification.js
const { 
  sendDiscordNotification, 
  sendSmsNotification, 
  sendNotification, 
  TEMPERATURE_VARIANCE,
  DISCORD_ENABLED,
  TWILIO_ENABLED,
  DISCORD_WEBHOOK_URL,
  MAX_UPTIME_MS,
  UPTIME_EXCEEDED_ENABLED
} = require('./notification.js');

// Test configuration
let notificationSent = false;
let uptimeNotificationSent = false;

// Simulated coffee machine data
let simulatedData = {
  temperature: 20,
  targetTemperature: 95,
  online: false,
  upTime: 0
};

// --- Simulated coffee machine status check ---
async function simulateCoffeeMachineStatus() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (!simulatedData.online) {
    console.log("🔌 [SIM] Coffee machine is offline (simulated)");
    return false;
  }

  const currentTemp = simulatedData.temperature;
  const targetTemp = simulatedData.targetTemperature;
  const uptimeMinutes = simulatedData.upTime;
  const variance = TEMPERATURE_VARIANCE; // Use the actual variance from notification.js
  const lowerBound = targetTemp - variance;
  const upperBound = targetTemp + variance;

  console.log(
    `🌡️ [SIM] Current Temp: ${currentTemp}°C, Target Temp: ${targetTemp}°C (Variance: ±${variance}°C), Uptime: ${uptimeMinutes} minutes`
  );

  // Check uptime and send notification if exceeded (same logic as notification.js)
  if (UPTIME_EXCEEDED_ENABLED && uptimeMinutes > (MAX_UPTIME_MS / 60000) && !uptimeNotificationSent) {
    console.log(`⚠️ [SIM] Machine has been running for ${uptimeMinutes} minutes (max: ${MAX_UPTIME_MS / 60000} minutes)`);
    await sendNotification(`⚠️ Your coffee machine has been running for ${uptimeMinutes} minutes. Consider turning it off to save energy.`);
    uptimeNotificationSent = true;
    console.log("✅ [SIM] Uptime warning notification sent!");
  }

  if (currentTemp >= lowerBound && currentTemp <= upperBound && !notificationSent) {
    console.log(`🎯 [SIM] TARGET REACHED! Temperature ${currentTemp}°C is within range!`);
    await sendNotification("Hey! Your machine is at the target temp.");
    notificationSent = true;
    console.log("✅ [SIM] Temperature notification sent successfully!");
    return true;
  }

  if (currentTemp < lowerBound) {
    console.log(`❄️ [SIM] Too cold (${currentTemp}°C < ${lowerBound}°C)`);
  } else if (currentTemp > upperBound) {
    console.log(`🔥 [SIM] Too hot (${currentTemp}°C > ${upperBound}°C)`);
  }

  return false;
}

// --- Test control functions ---
function setSimulatedTemperature(temp) {
  simulatedData.temperature = parseFloat(temp);
  console.log(`🌡️ [SIM] Temperature set to: ${simulatedData.temperature}°C`);
}

function setSimulatedTarget(temp) {
  simulatedData.targetTemperature = parseFloat(temp);
  console.log(`🎯 [SIM] Target temperature set to: ${simulatedData.targetTemperature}°C`);
}

function setSimulatedOnline(status) {
  simulatedData.online = Boolean(status);
  console.log(`🔌 [SIM] Online status: ${simulatedData.online ? 'Online' : 'Offline'}`);
}

function setSimulatedUptime(minutes) {
  simulatedData.upTime = parseInt(minutes);
  console.log(`⏰ [SIM] Uptime set to: ${simulatedData.upTime} minutes`);
}

function resetNotificationFlag() {
  notificationSent = false;
  console.log("🔄 [SIM] Temperature notification flag reset");
}

function resetUptimeNotificationFlag() {
  uptimeNotificationSent = false;
  console.log("🔄 [SIM] Uptime notification flag reset");
}

function resetAllFlags() {
  notificationSent = false;
  uptimeNotificationSent = false;
  console.log("🔄 [SIM] All notification flags reset");
}

function showSimulatedStatus() {
  console.log("\n📊 Current Simulated Status:");
  console.log(`   Temperature: ${simulatedData.temperature}°C`);
  console.log(`   Target: ${simulatedData.targetTemperature}°C`);
  console.log(`   Online: ${simulatedData.online ? 'Yes' : 'No'}`);
  console.log(`   Uptime: ${simulatedData.upTime} minutes`);
  console.log(`   Temperature Notification Sent: ${notificationSent ? 'Yes' : 'No'}`);
  console.log(`   Uptime Notification Sent: ${uptimeNotificationSent ? 'Yes' : 'No'}`);
  console.log(`   Uptime Monitoring Enabled: ${UPTIME_EXCEEDED_ENABLED ? 'Yes' : 'No'}`);
  console.log(`   Max Uptime: ${MAX_UPTIME_MS / 60000} minutes`);
}

// --- Individual notification tests ---
async function testDiscordOnly() {
  console.log("\n🧪 Testing Discord notification only...");
  await sendDiscordNotification("🧪 Test Discord notification from simulator!");
}

async function testSMSOnly() {
  console.log("\n🧪 Testing SMS notification only...");
  await sendSmsNotification("🧪 Test SMS notification from simulator!");
}

async function testBothNotifications() {
  console.log("\n🧪 Testing both Discord and SMS notifications...");
  await sendNotification("🧪 Test notification using sendNotification() function!");
}

// --- Uptime testing functions ---
async function testUptimeWarning() {
  console.log("\n⏰ Testing uptime warning notification...");
  
  if (!UPTIME_EXCEEDED_ENABLED) {
    console.log("❌ Uptime monitoring is disabled. Enable it in your .env file first.");
    return;
  }
  
  // Reset flags
  resetAllFlags();
  
  // Set machine online with high uptime
  setSimulatedOnline(true);
  setSimulatedUptime(50); // 50 minutes (above 45 minute limit)
  
  // This should trigger uptime warning
  await simulateCoffeeMachineStatus();
  
  console.log("✅ Uptime warning test completed!");
}

async function testUptimeMonitoringDisabled() {
  console.log("\n⏰ Testing uptime monitoring when disabled...");
  
  // Reset flags
  resetAllFlags();
  
  // Set machine online with high uptime
  setSimulatedOnline(true);
  setSimulatedUptime(50); // 50 minutes
  
  // Simulate status check
  await simulateCoffeeMachineStatus();
  
  if (uptimeNotificationSent) {
    console.log("❌ Uptime notification was sent when it should be disabled");
  } else {
    console.log("✅ Uptime notification correctly suppressed when disabled");
  }
}

async function testUptimeBelowLimit() {
  console.log("\n⏰ Testing uptime below warning limit...");
  
  // Reset flags
  resetAllFlags();
  
  // Set machine online with acceptable uptime
  setSimulatedOnline(true);
  setSimulatedUptime(30); // 30 minutes (below 45 minute limit)
  
  // This should NOT trigger uptime warning
  await simulateCoffeeMachineStatus();
  
  if (uptimeNotificationSent) {
    console.log("❌ Uptime notification was sent when uptime was below limit");
  } else {
    console.log("✅ Uptime notification correctly suppressed when uptime is acceptable");
  }
}

// --- Full brew cycle simulation ---
async function simulateBrewCycle() {
  console.log("\n🚀 Starting simulated brew cycle...");
  
  // Reset notification flags
  resetNotificationFlag();
  resetUptimeNotificationFlag();
  
  // Start cold and offline
  setSimulatedTemperature(20);
  setSimulatedOnline(false);
  setSimulatedUptime(0); // Reset uptime
  
  // Phase 1: Machine comes online and starts heating
  console.log("\n🔥 Phase 1: Machine coming online and heating up");
  setSimulatedOnline(true);
  
  for (let temp = 20; temp <= 94; temp += 5) {
    setSimulatedTemperature(temp);
    await simulateCoffeeMachineStatus();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Phase 2: Approaching target temperature
  console.log("\n🎯 Phase 2: Approaching target temperature");
  for (let temp = 94; temp <= 96; temp += 0.5) {
    setSimulatedTemperature(temp);
    const targetReached = await simulateCoffeeMachineStatus();
    if (targetReached) {
      console.log("🎉 [SIM] Target reached! Notification should have been sent!");
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Phase 3: Cooling down
  console.log("\n❄️ Phase 3: Cooling down");
  for (let temp = 96; temp >= 20; temp -= 5) {
    setSimulatedTemperature(temp);
    console.log(`🌡️ [SIM] Cooling: ${temp}°C`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log("\n✨ Simulated brew cycle complete!");
}

// --- Main test execution ---
async function runTests() {
  console.log("🧪 Coffee Machine Notification Tester");
  console.log("Using actual notification logic from notification.js");
  console.log("Simulating coffee machine status instead of real API calls\n");
  
  // Show current configuration
  console.log("📋 Current Configuration:");
  console.log(`   Discord: ${DISCORD_ENABLED ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Twilio SMS: ${TWILIO_ENABLED ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Webhook URL: ${DISCORD_WEBHOOK_URL ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Uptime Monitoring: ${UPTIME_EXCEEDED_ENABLED ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Max Uptime: ${MAX_UPTIME_MS / 60000} minutes\n`);
  
  // Run uptime tests first
  console.log("⏰ Testing Uptime Monitoring Features...");
  await testUptimeBelowLimit();
  await testUptimeWarning();
  await testUptimeMonitoringDisabled();
  
  console.log("\n🚀 Running Full Brew Cycle Simulation...");
  await simulateBrewCycle();
  
  console.log("\n✅ All tests completed!");
  console.log("Check your Discord channel and phone for notifications!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  simulateCoffeeMachineStatus,
  setSimulatedTemperature,
  setSimulatedTarget,
  setSimulatedOnline,
  setSimulatedUptime,
  resetNotificationFlag,
  resetUptimeNotificationFlag,
  resetAllFlags,
  showSimulatedStatus,
  testDiscordOnly,
  testSMSOnly,
  testBothNotifications,
  simulateBrewCycle,
  testUptimeWarning,
  testUptimeMonitoringDisabled,
  testUptimeBelowLimit
};
