import { ConfParams, config } from '../utils/config';
import { storeScu, storeScuOptions, Node as DicomNode } from 'dicom-dimse-native';
import { LoggerSingleton } from '../utils/logger';
import { v4 as uuid4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

type StoreDataResult = {
	code: number,
	message: string,
	container?: Record<string, unknown> | null
}

const EOL = '\r\n';
const dataSplitter = `${EOL}${EOL}`;
const transferSyntax = '1.2.840.10008.1.2.4.50';

function splitMultipart (buffer: Buffer, boundaryId: string): Buffer[] {
  let offset = 0;
  const tag = Buffer.from(`${EOL}--${boundaryId}${EOL}`);
  let ind = buffer.indexOf(tag);
  console.log('BE', ind);
  const splits = [];
  while (ind >= 0) {
    const len = ind - offset;
    const b = Buffer.alloc(len);
    buffer.copy(b, 0, offset, ind);
    splits.push(b);
    offset = ind + 1;
    ind = buffer.indexOf(tag, offset);
    console.log('IN', ind);
  }
  return splits.filter((s) => s.includes(Buffer.from('Content-ID')));
}

async function handleStowRequest (multipartData: Buffer, contentType: string) {
  if (contentType) {
    const matches = contentType.match(/boundary='(.*)'/i);
    if (matches) {
      const fragments = splitMultipart(multipartData, matches[1]);
      return fragments;
    }
    else {
      throw new Error('Could not split response data');
    }
  }
  return Promise.reject(new Error('Invalid response from proxy'));
}

async function getImagePixelData(fileBuffer: Buffer) {
  const ind = fileBuffer.indexOf(dataSplitter) + dataSplitter.length;
  const len = fileBuffer.length - ind;
  const newBuffer = Buffer.alloc(len);
  fileBuffer.copy(newBuffer, 0, ind, fileBuffer.length - EOL.length);
  return newBuffer;
}

async function checkExists (path: string) {
  return fs.stat(path)
    .then(() => true)
    .catch(() => false);
}

export async function storeData(multipartData: Buffer, contentType: string): Promise<StoreDataResult> {
  const logger = LoggerSingleton.Instance;
  const fileList = await handleStowRequest(multipartData, contentType);
  const storagePath = config.get(ConfParams.STORAGE_PATH) as string;
  const folderPath = path.join(process.cwd(), storagePath, 'stow', uuid4());
  if (!await checkExists(folderPath)) {
    await fs.mkdir(folderPath, { recursive: true });
  }

  await Promise.all(fileList.map(async (fileBuffer) => {
    const file = await getImagePixelData(fileBuffer);
    return fs.writeFile(path.join(folderPath, `${uuid4()}.dcm`), file);
  }));

  const peers = config.get(ConfParams.PEERS) as DicomNode[];
  const storeOptions: storeScuOptions = {
    sourcePath: folderPath,
    source: config.get(ConfParams.SOURCE),
    target: peers[0],
    netTransferPropose: transferSyntax,
    verbose: true
  };

  return new Promise((resolve, reject) => {
    try {
      storeScu(storeOptions, (result: string) => {
        if (result && result.length > 0) {
          try {
            const json = JSON.parse(result);
            logger.info(json);
            if (json.code === 0) {
              logger.info('STOW-RS finished', json);
              resolve(json);
            }
            else if (json.code === 2) {
              logger.error('STOW-RS Failed', json);
              reject(new Error(json.message));
            }
            else {
              logger.warn('STOW-RS Pending', json);
              resolve(json);
            }
          }
          catch (error) {
            logger.error('STOW-RS result didn\'t decode', result);
            reject(error);
          }
          finally {
            fs.rm(folderPath, { recursive: true });
          }
        }
      });
    }
    catch (e) {
      fs.rm(folderPath, { recursive: true });
      logger.error(e);
      reject(e);
    }
  });
}
