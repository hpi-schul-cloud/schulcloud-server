import path from 'path';
import { FileRecord } from '../domain';

export function hasDuplicateName(fileRecords: FileRecord[], name: string): FileRecord | undefined {
	const foundFileRecord = fileRecords.find((item) => item.hasName(name));

	return foundFileRecord;
}

export function resolveFileNameDuplicates(filename: string, fileRecords: FileRecord[]): string {
	let counter = 0;
	const filenameObj = path.parse(filename);
	let newFilename = filename;

	while (hasDuplicateName(fileRecords, newFilename)) {
		counter += 1;
		newFilename = `${filenameObj.name} (${counter})${filenameObj.ext}`;
	}

	return newFilename;
}
