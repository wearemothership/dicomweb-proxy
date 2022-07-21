import { ConfParams, config } from "../utils/config";
import { storeScu, storeScuOptions } from "dicom-dimse-native";
import { LoggerSingleton } from "../utils/logger";
import { v4 as uuid4 } from "uuid";
import fs from "fs/promises"
import path from "path";
import dcmjs from "dcmjs";

const dataSplitter = "\r\n\r\n";

type DicomMetadata = {
	[key: string]: {
		vr: string,
		Value: string[] | Record<string, string>[]
	}
}

function GenerateUidFromGuid(){
	const guid = uuid4();                         //Generate UUID using node-uuid *) package or some other similar package
	const guidBytes = `0${guid.replace(/-/g, "")}`; //add prefix 0 and remove `-`
	const bigInteger = BigInt(`0x${guidBytes}`);        //As big integer are not still in all browser supported I use BigInteger **) packaged to parse the integer with base 16 from uuid string
	return `2.25.${bigInteger.toString()}`;       //Output the previus parsed integer as string by adding `2.25.` as prefix
}

function splitMultipart (buffer: Buffer, boundaryId: string): Buffer[] {
	let offset = 0;
	const tag = `--${boundaryId}`;
	let ind = buffer.indexOf(tag);
	const splits = [];
	while (ind > 0) {
		const len = ind - offset;
		const b = Buffer.alloc(len);
		buffer.copy(b, 0, offset, ind);
		splits.push(b);
		offset = ind + 1;
		ind = buffer.indexOf(tag, offset);
	}
	return splits.filter((s) => s.includes(Buffer.from("Content-ID")));
}

async function handleStowRequest (multipartData: Buffer, contentType: string) {
	if (contentType) {
		const matches = contentType.match(/boundary='(.*)'/i);
		if (matches) {
			console.log("HAHA", matches[1])
			const fragments = splitMultipart(multipartData, matches[1]);
			console.log(fragments)
			return fragments
		}
		else {
			throw new Error("Could not split response data");
		}
	}
	return Promise.reject(new Error("Invalid response from proxy"));
}

function toArrayBuffer(buffer: Buffer) {
	return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
 }

async function getImagePixelData(fileBuffer: Buffer) {
	const ind = fileBuffer.indexOf(dataSplitter)
	const len = fileBuffer.length - ind;
	const newBuffer = Buffer.alloc(len)
	const headerBuffer = Buffer.alloc(ind)
	fileBuffer.copy(headerBuffer, 0, 0, ind)
	const header = headerBuffer.toString();
	const transferSyntax = header.match(/transfer-syntax:(.*);/ig)?.[0].split(":")?.[1]
	fileBuffer.copy(newBuffer, 0, ind + dataSplitter.length)
	const arr = toArrayBuffer(newBuffer);
	console.log("LEN", arr.byteLength)
	return { pixelData: arr, transferSyntax };
}

export async function storeData(multipartData: Buffer, contentType: string, studyUid?: string) {
	//const logger = LoggerSingleton.Instance;
	console.log(multipartData.length, contentType)
	const [metadataBuffer, fileBuffer] = await handleStowRequest(multipartData, contentType)
	const [, metadataString] = metadataBuffer.toString().split(dataSplitter)
	let metadata
	try {
		metadata = JSON.parse(metadataString)
	}
	catch (e) {
		console.error("Couldn't decode metadata", e)
	}

	const { pixelData, transferSyntax } = await getImagePixelData(fileBuffer)

	if (studyUid) {
		metadata = {
			...metadata,
			["0020000D"]: {
				Value: [studyUid],
				vr: "UI"
			}
		}
	}
	metadata = {
		...metadata,
		["00080018"]: {
			Value: [GenerateUidFromGuid()],
			vr: "UI" 
		},
		["00020010"]: {
			Value: [transferSyntax ?? "1.2.840.10008.1.2.1"],
			vr: "UI" 
		}
	}
	await fs.writeFile(path.resolve(`${process.cwd()}/tmp.txt`), JSON.stringify(metadata))
	// metadata["7FE00010"] = {
	// 	vr: "OW",
	// 	Value: [pixelData.toString()]
	// }

	const dicomDict = new dcmjs.data.DicomDict(metadata)
	dicomDict.upsertTag("7FE00010", "OW", [pixelData])
	const buffer = dicomDict.write({ allowInvalidVRLength: true })
	console.log(buffer)
	await fs.writeFile(path.resolve(`${process.cwd()}/tmp.dcm`), Buffer.from(buffer))

	// const getOptions: storeScuOptions = {
	// 	sourcePath: 
	// }
}
