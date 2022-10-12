import { ConflictException } from '@nestjs/common';
import { FileRecord } from '@shared/domain';
import { ErrorType } from '../../error';

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
