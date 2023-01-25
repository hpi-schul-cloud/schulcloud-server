import path from 'path';
import { FileRecordDO } from '../entity';

export function hasDuplicateName(fileRecords: FileRecordDO[], name: string): FileRecordDO | undefined {
	const foundFileRecord = fileRecords.find((fileRecord) => fileRecord.hasSameName(name));

	return foundFileRecord;
}

export function resolveFileNameDuplicates(filename: string, fileRecords: FileRecordDO[]): string {
	let counter = 0;
	const filenameObj = path.parse(filename);
	let newFilename = filename;

	while (hasDuplicateName(fileRecords, newFilename)) {
		counter += 1;
		newFilename = `${filenameObj.name} (${counter})${filenameObj.ext}`;
	}

	return newFilename;
}
