const { FreeSwitchServer } = require('esl');

global.sockets = {};

const nilLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
};

const isOk = (res) => {
  const rep = res?.body?.['Reply-Text'];

  return rep && !rep.contains('-ERR');
};



const createFsServer = async () => {
  const server = new FreeSwitchServer({ my_events: true, logger: nilLogger });

  server.on('connection', async (socket, { data, uuid}) => {
    global['sockets'][uuid] = socket;

    // await recorder(socket, uuid);
    await socket.execute('answer', '');
    const sample = 8000;
    // const aResult =
    await socket.api(
      `uuid_audio_fork ${uuid} start ws://127.0.0.1:3002/connection mono ${sample} botbug ${uuid} true true ${sample}`
    );

    // console.log('aResult', aResult);

    socket.on('socket.close', () => {
      delete global['sockets'][uuid];
      console.log('Socket closed');
    });
  });


  server.listen({ host: '0.0.0.0', port: 65023 })
    .then(() => console.log('Listening on 65023'))
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

const hangup = async (id, cause) => {
  const socket = global?.['sockets']?.[id];
  if (!socket) {
    console.error('No call found with id: ', id);
    return false;
  }

  return isOk(await socket.execute('hangup', cause ?? 'NORMAL_CLEARING'));
};

const transfer = async (id, extension) => {
  const socket = global?.['sockets']?.[id];
  if (!socket) {
    console.error('No call found with id: ', id);
    return false;
  }

  if (!extension) {
    console.error('No extension provided');
    return false;
  }

  return isOk(await socket.execute('bridge', '${sofia_contact(*/' + extension + ')}'));
};


module.exports = {
  createFsServer,
  hangup,
  transfer,
};
