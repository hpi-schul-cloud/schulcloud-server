import { EntityId, FileRecord } from '@shared/domain';
import { ErrorType } from '../error';
import { ICopyFiles } from '../interface';

export function createPath(schoolId: EntityId, fileRecordId: EntityId): string {
	if (!schoolId || !fileRecordId) {
		throw new Error(ErrorType.COULD_NOT_CREATE_PATH);
	}

	const path = [schoolId, fileRecordId].join('/');

	return path;
}

export function getPaths(fileRecords: FileRecord[]): string[] {
	const paths = fileRecords.map((fileRecord) => createPath(fileRecord.schoolId, fileRecord.id));

	return paths;
}

export function createICopyFiles(sourceFile: FileRecord, targetFile: FileRecord): ICopyFiles {
	const iCopyFiles = {
		sourcePath: createPath(sourceFile.schoolId, sourceFile.id),
		targetPath: createPath(targetFile.schoolId, targetFile.id),
	};

	return iCopyFiles;
}
