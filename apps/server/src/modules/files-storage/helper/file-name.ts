import { ConflictException } from '@nestjs/common';
import { FileRecord } from '@shared/domain';
import path from 'path';
import { ErrorType } from '../error';

export function checkDuplicatedNames(fileRecords: FileRecord[], newFileName: string): void {
	if (fileRecords.find((item) => item.name === newFileName)) {
		throw new ConflictException(ErrorType.FILE_NAME_EXISTS);
	}
}

export function modifyFileNameInScope(
	fileRecord: FileRecord,
	fileRecordsInScope: FileRecord[],
	newFileName: string
): FileRecord {
	checkDuplicatedNames(fileRecordsInScope, newFileName);
	fileRecord.name = newFileName;

	return fileRecord;
}

export function hasDuplicateName(fileRecords: FileRecord[], name: string): FileRecord | undefined {
	const foundFileRecord = fileRecords.find((item: FileRecord) => item.name === name);

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
