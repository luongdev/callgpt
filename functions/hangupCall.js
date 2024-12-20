require('dotenv').config();

const { hangup } = require('../services/freeswitch-service');

const hangupCall = async function (call) {

  console.log('Transferring call', call.callSid);

  return `${await hangup(call.callSid)}`;
};

module.exports = hangupCall;
