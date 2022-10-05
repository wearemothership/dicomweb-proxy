/* eslint-disable @typescript-eslint/ban-ts-comment */
import { config, ConfParams } from './utils/config';
import socket, { QidoRequest, WadoRequest } from './socket';
// @ts-ignore
import { Server, Socket } from 'socket.io';
import type {
  findScuOptions, KeyValue, getScuOptions, recompressOptions, storeScuOptions
} from 'dicom-dimse-native';
import { studyData, seriesData, instancesData, PacsData } from '../tests/testData';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import {expect, jest, test} from '@jest/globals';
import { mockFunction } from '../tests/jestHelpers';
import * as dimseNative from 'dicom-dimse-native';

const now = new Date();
const fileStats = {
  isFile: jest.fn<() => boolean>().mockReturnValue(true),
  isDirectory: jest.fn<() => boolean>().mockReturnValue(false),
  isBlockDevice: jest.fn<() => boolean>().mockReturnValue(false),
  isCharacterDevice: jest.fn<() => boolean>().mockReturnValue(false),
  isSymbolicLink: jest.fn<() => boolean>().mockReturnValue(false),
  isFIFO: jest.fn<() => boolean>().mockReturnValue(false),
  isSocket: jest.fn<() => boolean>().mockReturnValue(false),
  dev: 0,
  ino: 0,
  mode: 0,
  nlink: 0,
  uid: 0,
  gid: 0,
  rdev: 0,
  size: 12345,
  blksize: 123456,
  blocks: 10,
  atimeMs: 12222,
  mtimeMs: 12222,
  ctimeMs: 12222,
  birthtimeMs: 12222,
  atimeNs: BigInt(12222),
  mtimeNs: BigInt(12222),
  ctimeNs: BigInt(12222),
  birthtimeNs: BigInt(12222),
  atime: now,
  mtime: now,
  ctime: now,
  birthtime: now
};

jest.mock('./utils/logger', () => ({
  LoggerSingleton: { Instance: console }
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs') as Record<string, unknown>,
  promises: {
    stat: jest.fn()
  }
}));

jest.mock('fs/promises', () => ({
  stat: jest.fn(),
  readdir: jest.fn<() => Promise<string[]>>().mockResolvedValue(['1.2.345.67870', '1.2.345.67871', '1.2.345.67872', '1.2.345.67873']),
  readFile: jest.fn<() => Promise<Buffer>>().mockResolvedValue(Buffer.from('DICOM FILE BUFFER')),
  utimes: jest.fn<() => Promise<void>>().mockResolvedValue(),
  mkdir: jest.fn<() => Promise<void>>().mockResolvedValue(),
  writeFile: jest.fn<() => Promise<void>>().mockResolvedValue(),
  rm: jest.fn<() => Promise<void>>().mockResolvedValue()
}));

jest.mock('child_process', () => ({
  ...jest.requireActual('child_process') as Record<string, unknown>,
  execFile: (call: string, _argArray: string[], callback: (err?: Error, stdout?: Record<string, unknown>, stderr?: string) => void) => {
    switch (call) {
    case 'dcmj2pnm': {
      callback(undefined);
      break;
    }
    default: throw new Error('Unknown ExFile call');
    }
  }
}));

const findSpy = jest.spyOn(dimseNative, 'findScu');
beforeEach(() => {
  findSpy.mockImplementation((options: findScuOptions, callback: (result: string) => void) => {
    const levelTag = options.tags.find((t: KeyValue) => t.key === '00080052');
    if (levelTag) {
      switch (levelTag.value) {
      case 'STUDY': {
        callback(JSON.stringify({
          code: 0,
          container: JSON.stringify(studyData)
        }));
        break;
      }
      case 'SERIES': {
        callback(JSON.stringify({
          code: 0,
          container: JSON.stringify(seriesData)
        }));
        break;
      }
      case 'IMAGE': {
        callback(JSON.stringify({
          code: 0,
          container: JSON.stringify(instancesData)
        }));
        break;
      }
      default: callback(JSON.stringify({ code: 2, message: 'invalid level' }));
      }
    }
    else {
      callback(JSON.stringify({ code: 2, message: 'no level' }));
    }
  });
});

afterEach(() => {
  findSpy.mockReset();
});

let io: Server;

beforeAll(() => {
  io = new Server(6001);
  io.on('connection', (sock: Socket) => {
    console.log('SOCKET CONNECTED TO SERVER', sock.handshake.auth);
  });
});

afterAll(() => {
  io.close();
});

describe('Initial setup', () => {
  test('Test Config', () => {
    expect(config.get(ConfParams.WEBSOCKET_TOKEN)).toBe('TEST_WEBSOCKET_TOKEN');
    expect(config.get(ConfParams.STORAGE_PATH)).toBe('./data');
    expect(config.get(ConfParams.XTRANSFER)).toBe('1.2.840.10008.1.2.4.50');
    expect(config.get(ConfParams.MIMETYPE)).toBe('image/dicom+jpeg');
    expect(config.get(ConfParams.LOSSY_QUALITY)).toBe(80);
    expect(config.get(ConfParams.SECURE)).toBe(false);
    expect(config.get(ConfParams.WEBSOCKET_URL)).toBe('http://127.0.0.1:6001');
  });

  test('Websocket setup', async () => new Promise<void>((resolve, reject) => {
    socket.once('connect', () => {
      expect(socket.auth).toEqual(expect.objectContaining({ token: 'TEST_WEBSOCKET_TOKEN' }));
      socket.close();
      resolve();
    });
    socket.once('error', (err) => {
      reject(err);
    });
    socket.connect();
  }));
});

const qidoCalls = [
  ['studies', { level: 'STUDY', query: { } } as QidoRequest, studyData],
  ['series', { level: 'SERIES', query: { StudyInstanceUID: '1.2.345.67890' }} as QidoRequest, seriesData],
  ['instances', { level: 'IMAGE', query: { StudyInstanceUID: '1.2.345.67890', SeriesInstanceUID: '1.2.678.12345' }} as QidoRequest, instancesData]
];

const wadoCalls = [
  ['study instances', { query: { StudyInstanceUID: '1.2.345.67890' }} as WadoRequest, true],
  ['series instances', { query: { StudyInstanceUID: '1.2.345.67890', SeriesInstanceUID: '1.2.345.67880' }} as WadoRequest, true],
  ['instance', { query: { StudyInstanceUID: '1.2.345.67890', SeriesInstanceUID: '1.2.345.67880', SOPInstanceUID: '1.2.345.67870' }} as WadoRequest, false],
];

describe('Websocket Calls', () => {
  beforeAll(() => new Promise<void>((resolve, reject) => {
    socket.once('connect', () => {
      resolve();
    });
    socket.once('error', (err) => {
      reject(err);
    });
    socket.connect();
  }));

  afterAll(() => {
    socket.close();
  });

  beforeEach(() => {
    // @ts-ignore
    fs.promises.stat.mockReset();
    // @ts-ignore
    fsPromises.stat.mockReset();
  });

  describe.each(qidoCalls)('qido tests', (call, args, responseData) => {
    test(`qido ${call}`, () => new Promise<void>((resolve, reject) => {
      const respData = responseData as PacsData;
      const { level, query } = args as QidoRequest;
      io.timeout(5000).emit('qido-request', { level, query }, (err: Error, response: { success: boolean, data: Record<string, unknown>[] }[]) => {
        try {
          const responseJSON = response[0];
          expect(responseJSON.success).toBeTruthy();
          expect(responseJSON.data).toHaveLength(respData.length);
          for (let i = 0; i < responseJSON.data.length; i += 1) {
            expect(responseJSON.data[i]).toEqual(expect.objectContaining({ ...respData[i] }));
          }
          resolve();
        }
        catch (e) {
          reject(e);
        }
      });
    }));

    test(`qido ${call} (SCU fail)`, () => new Promise<void>((resolve, reject) => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      findSpy.mockReset();
      findSpy.mockImplementation((_options: findScuOptions, callback: (result: string) => void) => {
        callback(JSON.stringify({ code: 2, message: 'Test Error' }));
      });
      const { level, query } = args as QidoRequest;
      io.timeout(5000).emit('qido-request', { level, query }, (err: Error, response: { success: boolean, data: Record<string, unknown>[] }[]) => {
        try {
          const data = response[0];
          expect(data.success).toBeFalsy();
          resolve();
        }
        catch (e) {
          reject(e);
        }
        finally {
          errSpy.mockRestore();
        }
      });
    }));
  });

  describe.each(wadoCalls)('wado tests', (call, args, isDir) => {
    const getSpy = jest.spyOn(dimseNative, 'getScu');
    const recompressSpy = jest.spyOn(dimseNative, 'recompress');

    beforeEach(() => {
      getSpy.mockImplementation((_options: getScuOptions, callback: (result: string) => void) => {
        callback(JSON.stringify({ code: 0 }));
      });
      recompressSpy.mockImplementation((_options: recompressOptions, callback: (result: string) => void) => {
        callback(JSON.stringify({ code: 0 }));
      });
    });

    afterEach(() => {
      getSpy.mockReset();
      recompressSpy.mockReset();
    });

    test(`wado ${call}`, () => new Promise<void>((resolve, reject) => {
      const infoSpy = jest.spyOn(console, 'info');
      const { query } = args as WadoRequest;
      mockFunction(fs.promises.stat).mockImplementation(() => new Promise((statResolve, statReject) => {
        if (infoSpy.mock.calls.find((c) => c[0].match(/fetch finished/ig))) {
          statResolve({ ...fileStats, isDirectory: () => isDir as boolean });
        }
        else {
          statReject();
        }
      }));

      mockFunction(fsPromises.stat).mockImplementation(() => new Promise((statResolve, statReject) => {
        if (infoSpy.mock.calls.find((c) => c[0].match(/fetch finished/ig))) {
          statResolve({ ...fileStats, isDirectory: () => isDir as boolean });
        }
        else {
          statReject();
        }
      }));

      io.timeout(5000).emit('wado-request', { query }, (err: Error, response: { buffer: Buffer, headers: Record<string, string>, success: boolean }[]) => {
        try {
          const { buffer, headers, success } = response[0];
          expect(success).toBeTruthy();
          expect(buffer.toString()).toMatchSnapshot();
          expect(headers).toEqual(expect.objectContaining({
            contentType: 'multipart/related;type=\'application/dicom\';boundary=1.2.345.67890'
          }));
          resolve();
        }
        catch (e) {
          reject(e);
        }
        finally {
          infoSpy.mockRestore();
        }
      });
    }));

    test(`wado ${call} thumbnails`, () => new Promise<void>((resolve, reject) => {
      mockFunction(fsPromises.readFile).mockReset();
      mockFunction(fsPromises.readFile).mockResolvedValue(Buffer.from('JPEG FILE BUFFER'));
      const infoSpy = jest.spyOn(console, 'info');
      const { query } = args as WadoRequest;
      mockFunction(fs.promises.stat).mockImplementation(() => new Promise((statResolve, statReject) => {
        if (infoSpy.mock.calls.find((c) => c[0].match(/fetch finished/ig))) {
          statResolve({ ...fileStats, isDirectory: () => isDir as boolean });
        }
        else {
          statReject();
        }
      }));

      mockFunction(fsPromises.stat).mockImplementation(() => new Promise((statResolve, statReject) => {
        if (infoSpy.mock.calls.find((c) => c[0].match(/fetch finished/ig))) {
          statResolve({ ...fileStats, isDirectory: () => isDir as boolean });
        }
        else {
          statReject();
        }
      }));

      io.timeout(5000).emit('wado-request', { query: { ...query, dataFormat: 'thumbnail'} }, (err: Error, response: { buffer: Buffer, headers: Record<string, string>, success: boolean }[]) => {
        try {
          const { buffer, headers, success } = response[0];
          expect(success).toBeTruthy();
          expect(buffer.toString()).toMatchSnapshot();
          expect(headers).toEqual(expect.objectContaining({
            contentType: 'image/jpeg'
          }));
          resolve();
        }
        catch (e) {
          reject(e);
        }
        finally {
          infoSpy.mockRestore();
          mockFunction(fsPromises.readFile).mockReset();
          mockFunction(fsPromises.readFile).mockResolvedValue(Buffer.from('DICOM FILE BUFFER'));
        }
      });
    }));

    // This succeeds on purpose - I don't want failure to compress to stop the WADO request
    test(`wado ${call} (no recompress)`, () => new Promise<void>((resolve, reject) => {
      recompressSpy.mockReset();
      recompressSpy.mockImplementation((_options: recompressOptions, callback: (result: string) => void) => {
        callback(JSON.stringify({ code: 2, message: 'Test Error' }));
      });
      const infoSpy = jest.spyOn(console, 'info');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const { query } = args as WadoRequest;
      mockFunction(fs.promises.stat).mockImplementation(() => new Promise((statResolve, statReject) => {
        if (infoSpy.mock.calls.find((c) => c[0].match(/fetch finished/ig))) {
          statResolve({ ...fileStats, isDirectory: () => isDir as boolean });
        }
        else {
          statReject();
        }
      }));

      mockFunction(fsPromises.stat).mockImplementation(() => new Promise((statResolve, statReject) => {
        if (infoSpy.mock.calls.find((c) => c[0].match(/fetch finished/ig))) {
          statResolve({ ...fileStats, isDirectory: () => isDir as boolean });
        }
        else {
          statReject();
        }
      }));

      io.timeout(5000).emit('wado-request', { query }, (err: Error, response: { buffer: Buffer, headers: Record<string, string>, success: boolean }[]) => {
        try {
          const { buffer, headers, success } = response[0];
          expect(success).toBeTruthy();
          expect(buffer.toString()).toMatchSnapshot();
          expect(headers).toEqual(expect.objectContaining({
            contentType: 'multipart/related;type=\'application/dicom\';boundary=1.2.345.67890'
          }));
          expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('recompression failure'));
          expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to compress'), expect.any(String));
          resolve();
        }
        catch (e) {
          reject(e);
        }
        finally {
          infoSpy.mockRestore();
          errorSpy.mockRestore();
        }
      });
    }));

    test(`wado ${call} (with cache)`, () => new Promise<void>((resolve, reject) => {
      const { query } = args as WadoRequest;
      mockFunction(fs.promises.stat).mockResolvedValue({ ...fileStats, isDirectory: () => isDir as boolean });
      mockFunction(fsPromises.stat).mockResolvedValue({ ...fileStats, isDirectory: () => isDir as boolean });

      io.timeout(5000).emit('wado-request', { query }, (err: Error, response: { buffer: Buffer, headers: Record<string, string>, success: boolean }[]) => {
        try {
          const { buffer, headers, success } = response[0];
          expect(success).toBeTruthy();
          expect(buffer.toString()).toMatchSnapshot();
          expect(headers).toEqual(expect.objectContaining({
            contentType: 'multipart/related;type=\'application/dicom\';boundary=1.2.345.67890'
          }));
          resolve();
        }
        catch (e) {
          reject(e);
        }
      });
    }));

    test(`wado ${call} (failed to fetch - file not exist)`, () => new Promise<void>((resolve, reject) => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const { query } = args as WadoRequest;
      mockFunction(fs.promises.stat).mockRejectedValue(new Error('Not Found'));
      mockFunction(fsPromises.stat).mockRejectedValue(new Error('Not Found'));

      io.timeout(5000).emit('wado-request', { query }, (err: Error, response: { buffer: Buffer, headers: Record<string, string>, success: boolean }[]) => {
        try {
          const { success } = response[0];
          expect(success).toBeFalsy();
          resolve();
        }
        catch (e) {
          reject(e);
        }
        finally {
          errSpy.mockRestore();
        }
      });
    }));

    test(`wado ${call} (SCU Fail)`, () => new Promise<void>((resolve, reject) => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const infoSpy = jest.spyOn(console, 'info');
      getSpy.mockReset();
      getSpy.mockImplementation((_options: getScuOptions, callback: (result: string) => void) => {
        callback(JSON.stringify({ code: 2, message: 'Test Error' }));
      });

      const { query } = args as WadoRequest;
      mockFunction(fs.promises.stat).mockImplementation(() => new Promise((statResolve, statReject) => {
        if (infoSpy.mock.calls.find((c) => c[0].match(/fetch finished/ig))) {
          statResolve({ ...fileStats, isDirectory: () => isDir as boolean });
        }
        else {
          statReject();
        }
      }));

      mockFunction(fsPromises.stat).mockImplementation(() => new Promise((statResolve, statReject) => {
        if (infoSpy.mock.calls.find((c) => c[0].match(/fetch finished/ig))) {
          statResolve({ ...fileStats, isDirectory: () => isDir as boolean });
        }
        else {
          statReject();
        }
      }));


      io.timeout(5000).emit('wado-request', { query }, (err: Error, response: { buffer: Buffer, headers: Record<string, string>, success: boolean }[]) => {
        try {
          const { success } = response[0];
          expect(success).toBeFalsy();
          resolve();
        }
        catch (e) {
          reject(e);
        }
        finally {
          infoSpy.mockRestore();
          errSpy.mockRestore();
        }
      });
    }));
  });

  describe('Stow Tests', () => {
    const storeSpy = jest.spyOn(dimseNative, 'storeScu');

    beforeEach(() => {
      storeSpy.mockImplementation((_options: storeScuOptions, callback: (result: string) => void) => {
        callback(JSON.stringify({ code: 0 }));
      });
    });

    afterEach(() => {
      storeSpy.mockReset();
    });
    
    test('STOW File', () => new Promise<void>((resolve, reject) => {
      const EOL = '\r\n';
      fs.readFile(path.resolve('./tests/testDICOM.dcm'), (err, fileBuffer) => {
        if (err) {
          reject(err);
        }
        const boundary = 'file-boundary';
        const buffArray: Buffer[] = [];
        buffArray.push(Buffer.from(`--${boundary}${EOL}`));
        buffArray.push(Buffer.from(`Content-Type:image/dicom${EOL}`));
        buffArray.push(Buffer.from(EOL));
        buffArray.push(Buffer.from(fileBuffer));
        buffArray.push(Buffer.from(EOL));
        buffArray.push(Buffer.from(`--${boundary}--${EOL}`));
        const buffToSend = Buffer.concat(buffArray);
        io.timeout(5000).emit('stow-request', buffToSend, { contentType: `multipart/related;type='application/dicom';boundary=${boundary}` }, (err: Error, response: [{ success: boolean }]) => {
          try {
            const filePathRx = new RegExp(/\\data\\stow\\[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}\\[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}.dcm/ig);
            expect(response[0].success).toBeTruthy();
            expect(fsPromises.writeFile).toHaveBeenCalledWith(expect.stringMatching(filePathRx), expect.any(Buffer));
            resolve();
          }
          catch (e) {
            reject(e);
          }
        });
      });
    }));

    test('STOW File (no content type)', () => new Promise<void>((resolve, reject) => {
      const EOL = '\r\n';
      fs.readFile(path.resolve('./tests/testDICOM.dcm'), (err, fileBuffer) => {
        if (err) {
          reject(err);
        }
        const boundary = 'file-boundary';
        const buffArray: Buffer[] = [];
        buffArray.push(Buffer.from(`--${boundary}${EOL}`));
        buffArray.push(Buffer.from(`Content-Type:image/dicom${EOL}`));
        buffArray.push(Buffer.from(EOL));
        buffArray.push(Buffer.from(fileBuffer));
        buffArray.push(Buffer.from(EOL));
        buffArray.push(Buffer.from(`--${boundary}--${EOL}`));
        const buffToSend = Buffer.concat(buffArray);
        io.timeout(5000).emit('stow-request', buffToSend, { contentType: undefined }, (err: Error, response: [{ success: boolean }]) => {
          try {
            expect(response[0].success).toBeFalsy();
            resolve();
          }
          catch (e) {
            reject(e);
          }
        });
      });
    }));

    test('STOW File (no boundary set)', () => new Promise<void>((resolve, reject) => {
      const EOL = '\r\n';
      fs.readFile(path.resolve('./tests/testDICOM.dcm'), (err, fileBuffer) => {
        if (err) {
          reject(err);
        }
        const boundary = 'file-boundary';
        const buffArray: Buffer[] = [];
        buffArray.push(Buffer.from(`--${boundary}${EOL}`));
        buffArray.push(Buffer.from(`Content-Type:image/dicom${EOL}`));
        buffArray.push(Buffer.from(EOL));
        buffArray.push(Buffer.from(fileBuffer));
        buffArray.push(Buffer.from(EOL));
        buffArray.push(Buffer.from(`--${boundary}--${EOL}`));
        const buffToSend = Buffer.concat(buffArray);
        io.timeout(5000).emit('stow-request', buffToSend, { contentType: 'multipart/related;type=\'application/dicom\';boundary=' }, (err: Error, response: [{ success: boolean }]) => {
          try {
            expect(response[0].success).toBeFalsy();
            resolve();
          }
          catch (e) {
            reject(e);
          }
        });
      });
    }));

    test('STOW File (invalid buffer)', () => new Promise<void>((resolve, reject) => {
      fs.readFile(path.resolve('./tests/testDICOM.dcm'), (err, fileBuffer) => {
        if (err) {
          reject(err);
        }
        const boundary = 'file-boundary';
        io.timeout(5000).emit('stow-request', fileBuffer, { contentType: `multipart/related;type='application/dicom';boundary=${boundary}` }, (err: Error, response: [{ success: boolean }]) => {
          try {
            expect(response[0].success).toBeFalsy();
            resolve();
          }
          catch (e) {
            reject(e);
          }
        });
      });
    }));

    test('STOW File (SCU Failed)', () => new Promise<void>((resolve, reject) => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      storeSpy.mockReset();
      storeSpy.mockImplementation((_options: storeScuOptions, callback: (result: string) => void) => {
        callback(JSON.stringify({ code: 2, message: 'Test Error' }));
      });
      const EOL = '\r\n';
      fs.readFile(path.resolve('./tests/testDICOM.dcm'), (err, fileBuffer) => {
        if (err) {
          reject(err);
        }
        const boundary = 'file-boundary';
        const buffArray: Buffer[] = [];
        buffArray.push(Buffer.from(`--${boundary}${EOL}`));
        buffArray.push(Buffer.from(`Content-Type:image/dicom${EOL}`));
        buffArray.push(Buffer.from(EOL));
        buffArray.push(Buffer.from(fileBuffer));
        buffArray.push(Buffer.from(EOL));
        buffArray.push(Buffer.from(`--${boundary}--${EOL}`));
        const buffToSend = Buffer.concat(buffArray);
        io.timeout(5000).emit('stow-request', buffToSend, { contentType: `multipart/related;type='application/dicom';boundary=${boundary}` }, (err: Error, response: [{ success: boolean }]) => {
          try {
            const filePathRx = new RegExp(/\\data\\stow\\[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}\\[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}.dcm/ig);
            expect(response[0].success).toBeFalsy();
            expect(fsPromises.writeFile).toHaveBeenCalledWith(expect.stringMatching(filePathRx), expect.any(Buffer));
            resolve();
          }
          catch (e) {
            reject(e);
          }
          finally {
            errSpy.mockRestore();
          }
        });
      });
    }));
  });
});
