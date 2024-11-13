require('dotenv').config();

const { transfer } = require('../services/freeswitch-service');

const transferCall = async function (call) {

  console.log('Transferring call', call.callSid);

  return `${await transfer(call.callSid, process.env.TRANSFER_NUMBER)}`;
};

module.exports = transferCall;
