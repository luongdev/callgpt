async function getAgentName(functionArgs) {
  console.log('getAgentName', JSON.stringify(functionArgs));

  if (functionArgs.callSid?.length) {
    return JSON.stringify({
      agentName: 'John Doe',
    });
  }
}

module.exports = getAgentName;
