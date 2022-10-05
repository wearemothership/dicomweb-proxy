import { ConfParams, config } from './utils/config';
import { io } from 'socket.io-client';
import type { ManagerOptions, SocketOptions } from 'socket.io-client';
import { doFind } from './dimse/findData';
import { stringToQueryLevel } from './dimse/querLevel';
import { doWadoUri } from './dimse/wadoUri';
import { LoggerSingleton } from './utils/logger';
import { doWadoRs, DataFormat } from './dimse/wadoRs';
import { storeData } from './dimse/storeData';
import socketIOStream from '@wearemothership/socket.io-stream';
import combineMerge from './utils/combineMerge';
import deepmerge from 'deepmerge';
import { readFileSync } from 'fs';

const options = { arrayMerge: combineMerge };
const websocketUrl = config.get(ConfParams.WEBSOCKET_URL) as string;
const logger = LoggerSingleton.Instance;

type StowInfo = {
  uuid: string,
  contentType: string
}

const ioConfig: Partial<ManagerOptions & SocketOptions> = {
  reconnection: true,
  reconnectionDelayMax: 10000,
  autoConnect: false,
  auth: {
    token: config.get(ConfParams.WEBSOCKET_TOKEN),
  },
  transports: ['websocket']
};

if (config.get(ConfParams.SECURE)) {
  logger.info('Starting secure server');
  ioConfig.cert = readFileSync(config.get(ConfParams.CERT), 'utf8').toString();
  ioConfig.key = readFileSync(config.get(ConfParams.KEY), 'utf8').toString();
  ioConfig.ca = readFileSync(config.get(ConfParams.CA), 'utf8').toString();
}

const socket = io(websocketUrl, ioConfig);

socket.on('connect', () => {
  logger.info('websocket connection established');
});

socket.on('connect_error', (err) => {
  logger.error('[SocketIO] Error connecting ', err);
});

export type QidoRequest = {
  level: string,
  query: {
    StudyInstanceUID?: string,
    SeriesInstanceUID?: string,
    SOPInstanceUID?: string
  }
}

socket.on('qido-request', async (data, callback) => {
  const { level, query }: QidoRequest = data;
  if (data) {
    try {
      const lvl = stringToQueryLevel(level);
      logger.info('websocket QIDO request received, fetching metadata now...');
      const data = await doFind(lvl, query);
      const json = deepmerge.all(data, options);
      logger.info('sending websocket response: ', data.uuid ? 'using emit' : 'using callback', !!callback);
      if (data.uuid) {
        socket.emit(data.uuid, json);
      }
      else {
        callback?.({ success: true, data: json });
      }
    }
    catch (e) {
      if (data.uuid) {
        socket.emit(data.uuid, e);
      }
      else {
        callback?.({ success: false, message: (e as Error).message });
      }
    }
  }
});

export type WadoRequest = {
  query: {
    StudyInstanceUID: string,
    SeriesInstanceUID?: string,
    SOPInstanceUID?: string,
    dataFormat?: DataFormat
  }
}

socket.on('wado-request', async (data, callback) => {
  const { query }: WadoRequest = data;
  const {
    StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID, dataFormat
  } = query;

  if (data) {
    logger.info('websocket WADO request received, fetching metadata now...');
    try {
      const { contentType, buffer } = await doWadoRs({
        studyInstanceUid: StudyInstanceUID,
        seriesInstanceUid: SeriesInstanceUID,
        sopInstanceUid: SOPInstanceUID,
        dataFormat
      });
      logger.info('sending websocket response stream: ', data.uuid ? 'using emit' : 'using callback', !!callback, ' size ', buffer.length);
      
      if (data.uuid) {
        const stream = socketIOStream.createStream();
        const ss = socketIOStream(socket);
        ss.emit(data.uuid, stream, { contentType: contentType });

        let offset = 0;
        const chunkSize = 512*1024; // 512kb
        const writeBuffer = () => {
          let ok = true;
          do {
            const b = Buffer.alloc(chunkSize);
            buffer.copy(b, 0, offset, offset + chunkSize);
            ok = stream.write(b);
            offset += chunkSize;
          } while (offset < buffer.length && ok);
          if (offset < buffer.length) {
            stream.once('drain', writeBuffer);
          }
          else {
            stream.end();
          }
        };
        writeBuffer();
      }
      else {
        callback?.({ success: true, buffer, headers: { contentType: contentType } });
      }
    }
    catch (e) {
      logger.error('Emitting error', e);
      if (data.uuid) {
        socket.emit(data.uuid, e);
      }
      else {
        callback?.({ success: false, message: (e as Error).message });
      }
    }
  }
});

socket.on('stow-request', async (stream: Buffer, info: StowInfo, callback): Promise<void> => {
  logger.info('websocket STOW-RS request received');
  const { uuid, contentType } = info;

  try {
    const result = await storeData(stream, contentType);
    if (uuid) {
      socket.emit(uuid, { success: true, message: result.message });
    }
    else {
      callback?.({ success: true, message: result.message });
    }
  }
  catch (e) {
    if (uuid) {
      socket.emit(uuid, { success: false, message: (e as Error).message });
    }
    else {
      callback?.({ success: false, message: (e as Error).message });
    }
  }
});

socket.on('wadouri-request', async (data, callback) => {
  if (data) {
    const {
      studyUID, seriesUID, objectUID, studyInstanceUid, seriesInstanceUid, sopInstanceUid
    } = data.query;
    try {
      logger.info('websocket wadouri request received, fetching metadata now...');
      const rsp = await doWadoUri({
        studyInstanceUid: studyInstanceUid ?? studyUID,
        seriesInstanceUid: seriesInstanceUid ?? seriesUID,
        sopInstanceUid: sopInstanceUid ?? objectUID
      });
      if (data.uuid) {
        socket.emit(data.uuid, rsp);
      }
      else {
        callback?.({ success: true, ...rsp });
      }
    }
    catch (error) {
      logger.error(error);
      if (data.uuid) {
        socket.emit(data.uuid, error);
      }
      else {
        callback?.({ success: false, message: (error as Error).message });
      }
    }
  }
});

socket.on('disconnect', () => {
  logger.info('websocket connection disconnected');
});

export default socket;
