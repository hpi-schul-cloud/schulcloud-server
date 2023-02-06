import path from 'path';
import { FileRecordEntity } from '../entity';

export function hasDuplicateName(fileRecords: FileRecordEntity[], name: string): FileRecordEntity | undefined {
	const foundFileRecord = fileRecords.find((item: FileRecordEntity) => item.hasName(name));

	return foundFileRecord;
}

export function resolveFileNameDuplicates(filename: string, fileRecords: FileRecordEntity[]): string {
	let counter = 0;
	const filenameObj = path.parse(filename);
	let newFilename = filename;

	while (hasDuplicateName(fileRecords, newFilename)) {
		counter += 1;
		newFilename = `${filenameObj.name} (${counter})${filenameObj.ext}`;
	}

	return newFilename;
}
