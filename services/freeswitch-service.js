const { FreeSwitchServer } = require('esl');

global.sockets = {};

const nilLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
};

const createFsServer = async (ttsService) => {
  const server = new FreeSwitchServer({ my_events: true, logger: nilLogger });

  server.on('connection', async (socket, { data, uuid}) => {
    global['sockets'][uuid] = socket;

    await socket.execute('answer', '');
    const sample = 8000;
    const aResult = await socket.api(
      `uuid_audio_fork ${uuid} start ws://10.8.0.2:3001/connection mono ${sample} botbug ${uuid} true true ${sample}`
    );

    console.log('aResult', aResult);



    socket.on('socket.close', () => {
      delete global['sockets'][uuid];
      console.log('Socket closed');
    });
  });


  server.listen({ host: '0.0.0.0', port: 65022 })
    .then(() => console.log('Listening on 65022'))
    .catch(console.error);



  // if (opts['onConnection'] && typeof opts['onConnection'] === 'function') {
  //   server.on('connection::open', opts['onConnection']);
  // }
  //
  // if (opts['onReady'] && typeof opts['onReady'] === 'function') {
  //   server.on('ready', opts['onReady']);
  // }
  //
  // if (opts['onClose'] && typeof opts['onClose'] === 'function') {
  //   server.on('close', opts['onClose']);
  // }
  //
  // if (opts['onError'] && typeof opts['onError'] === 'function') {
  //   server.on('error', opts['onError']);
  // }

  return server;
};


module.exports = {
  createFsServer
};
