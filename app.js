require('dotenv').config();
require('colors');

const express = require('express');
const ExpressWs = require('express-ws');

const { GptService } = require('./services/gpt-service');
const { StreamService } = require('./services/stream-service');
const { TranscriptionService } = require('./services/transcription-service');
const { TextToSpeechService } = require('./services/tts-service');
const { createFsServer, hangup, transfer } = require('./services/freeswitch-service');


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

const app = express();
// app.use();

ExpressWs(app);

const PORT = process.env.PORT || 3002;

app.delete('/:id/hangup', async (req, res) => {
  const { id } = req.params || {};
  const { cause } = req.query || {};

  res.status((await hangup(id, cause)) ? 200 : 400).json();
});

app.put('/:id/transfer', async (req, res) => {

  const { id } = req.params || {};
  const { extension, context } = req.query || {};

  res.status((await transfer(id, `${extension}@${context}`)) ? 200 : 400).json();
});

app.ws('/connection', (ws) => {
  try {
    ws.on('error', console.error);
    // Filled in from start message
    let streamSid;
    let callSid;

    const gptService = new GptService();
    const streamService = new StreamService(ws);
    const transcriptionService = new TranscriptionService();
    const ttsService = new TextToSpeechService();

    let marks = [];
    let interactionCount = 0;

    // Incoming from MediaStream
    ws.on('message', function message(data) {
      if (typeof data === 'string') {
        console.log('Freeswitch data', data);
        streamSid = data;
        callSid = data;

        streamService.setStreamSid(streamSid);
        gptService.setCallSid(callSid).completion('', 1, 'user', 'user');
        return;
      }

      if (typeof data === 'object') {
        transcriptionService.send(data);
      }
    });

    transcriptionService.on('utterance', async (text) => {
      // This is a bit of a hack to filter out empty utterances
      if(marks.length > 0 && text?.length > 5) {
        console.log('Twilio -> Interruption, Clearing stream'.red, text);
        ws.send(
          JSON.stringify({
            streamSid,
            event: 'clear',
          })
        );
      }
    });

    transcriptionService.on('transcription', async (text) => {
      if (!text) { return; }
      console.log(`Interaction ${interactionCount} – STT -> GPT: ${text}`.yellow);
      gptService.completion(text, interactionCount);
      interactionCount += 1;
    });

    gptService.on('gptreply', async (gptReply, icount) => {
      gptReply.partialResponse = replaceTemplate(gptReply.partialResponse, gptReply.args);

      console.log(`Interaction ${icount}: GPT -> TTS: ${gptReply.partialResponse}`.green );
      ttsService.generate(gptReply, icount);
    });

    ttsService.on('speech', (responseIndex, audio, label, icount) => {
      console.log(`Interaction ${icount}: TTS -> TWILIO: ${label}`.blue);
      streamService.buffer(responseIndex, audio);
    });

    streamService.on('audiosent', (markLabel) => {
      marks.push(markLabel);
    });
  } catch (err) {
    console.log(err);
  }
});
app.listen(PORT);
createFsServer().catch(console.error);


console.log(`Server running on port ${PORT}`);
