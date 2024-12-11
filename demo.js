const { GptService } = require('./services/gpt-service');
const express = require('express');
const app = express();

const gptService = new GptService();


function replaceTemplate(text = '', args  = '{}') {
  try {
    const obj = JSON.parse(args);
    return text.replace(/{{(.*?)}}/g, (match, key) => {
      if (obj[key]) {
        return obj[key];
      }
      return match;
    });
  } catch (e) {
    return text;
  }
}

gptService.on('gptreply', async (gptReply, icount) => {
  const text = replaceTemplate(gptReply.partialResponse, gptReply.args);

  console.log(`Interaction ${icount}: GPT -> TTS: ${text}`.green );

  if (icount === 1) {
    setTimeout(() => {
      gptService.completion('I am Nowf, my ic number is 6969696969', ++icount,'user');
    }, 3000);
  } else if (icount === 2) {
    setTimeout(() => {
      gptService.completion('Sure, i agree', ++icount,'user');
    }, 3000);
  }
});


gptService.setCallSid('a1b2c3d4').completion('', 1, 'user', 'user');


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
