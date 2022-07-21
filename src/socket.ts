import { ConfParams, config } from './utils/config';
import { io } from 'socket.io-client';
import { doFind } from './dimse/findData';
import { stringToQueryLevel } from './dimse/querLevel';
import { doWadoUri } from './dimse/wadoUri';
import { LoggerSingleton } from './utils/logger';
import { doWadoRs } from './dimse/wadoRs';
import socketIOStream from 'socket.io-stream';
import { storeData } from './dimse/storeData';

const websocketUrl = config.get(ConfParams.WEBSOCKET_URL) as string;
const logger = LoggerSingleton.Instance;

type StowInfo = {
  uuid: string,
  contentType: string
}

export const socket = io(websocketUrl, {
  reconnection: true,
  reconnectionDelayMax: 10000,
  autoConnect: false,
  auth: {
    token: config.get(ConfParams.WEBSOCKET_TOKEN),
  },
  transports: ["websocket"],
  secure: true
});

socket.on('connect', () => {
  logger.info('websocket connection established');
});

socket.on('qido-request', async (data) => {
  logger.info('websocket QIDO request received, fetching metadata now...');
  const { level, query }: { level: string; query: Record<string, string> } = data;

  if (data) {
    const lvl = stringToQueryLevel(level);
    const json = await doFind(lvl, query);
    logger.info('sending websocket response');
    socket.emit(data.uuid, json);
  }
});

socket.on('wado-request', async (data) => {
  logger.info('websocket WADO request received, fetching metadata now...');
  const { query }: { query: Record<string, string> } = data;
  const {
    studyInstanceUid, seriesInstanceUid, sopInstanceUid
  } = query;

  if (data) {
    const { contentType, buffer } = await doWadoRs({ studyInstanceUid, seriesInstanceUid, sopInstanceUid });
    logger.info('sending websocket response stream');
    const stream = socketIOStream.createStream();
    socketIOStream(socket).emit(data.uuid, stream, { contentType: contentType })
    let offset = 0;
    const chunkSize = 512*1024 // 512kb
    const writeBuffer = () => {
      let ok = true;
      do {
        const b = Buffer.alloc(chunkSize)
        buffer.copy(b, 0, offset, offset + chunkSize)
        ok = stream.write(b)
        offset += chunkSize
      } while (offset < buffer.length && ok)
      if (offset < buffer.length) {
        stream.once("drain", writeBuffer)
      }
      else {
        stream.end()
      }
    }
    writeBuffer()
  }
});

socketIOStream(socket).on("stow-request", async (stream: any, info: StowInfo) => new Promise((resolve) => {
  logger.info('websocket STOW-RS request received');
  const { uuid, contentType } = info;
  const buff: Buffer[] = []
  stream.on("data", (data: Buffer) => {
    buff.push(data)
  });

  stream.on("end", async () => {
    const b = Buffer.concat(buff);
    console.log(b.length)
    await storeData(b, contentType)
    socket.emit(uuid, "DONE")
  })
}))

socket.on('wadouri-request', async (data) => {
  logger.info('websocket wadouri request received, fetching metadata now...');
  if (data) {
    const {
      studyUID, seriesUID, objectUID, studyInstanceUid, seriesInstanceUid, sopInstanceUid
    } = data.query;
    try {
      const rsp = await doWadoUri({
        studyInstanceUid: studyInstanceUid ?? studyUID,
        seriesInstanceUid: seriesInstanceUid ?? seriesUID,
        sopInstanceUid: sopInstanceUid ?? objectUID
      });
      socket.emit(data.uuid, rsp);
    } catch (error) {
      logger.error(error);
      socket.emit(data.uuid, error);
    }
  }
});

socket.on('disconnect', () => {
  logger.info('websocket connection disconnected');
});
