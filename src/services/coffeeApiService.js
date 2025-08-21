const axios = require("axios");
const { COFFEE_MACHINE_API_URL } = require('../config');

/**
 * Check coffee machine status via API
 */
async function checkCoffeeMachineStatus() {
  try {
    const response = await axios.get(COFFEE_MACHINE_API_URL, {
      timeout: 10000 // 10 second timeout
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error };
  }
}

module.exports = {
  checkCoffeeMachineStatus
};
