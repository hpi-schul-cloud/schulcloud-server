import { EntityId } from '@shared/domain';
import { FileRecord } from '../entity';
import { ErrorType } from '../error';
import { ICopyFiles } from '../interface';

export function createPath(schoolId: EntityId, fileRecordId: EntityId): string {
	if (!schoolId || !fileRecordId) {
		throw new Error(ErrorType.COULD_NOT_CREATE_PATH);
	}

	const path = [schoolId, fileRecordId].join('/');

	return path;
}

export function createPreviewDirectoryPath(schoolId: EntityId, sourceFileRecordId: EntityId): string {
	const path = ['previews', schoolId, sourceFileRecordId].join('/');

	return path;
}

export function createPreviewFilePath(schoolId: EntityId, hash: string, sourceFileRecordId: EntityId): string {
	const folderPath = createPreviewDirectoryPath(schoolId, sourceFileRecordId);
	const filePath = [folderPath, hash].join('/');

	return filePath;
}

export function getPaths(fileRecords: FileRecord[]): string[] {
	const paths = fileRecords.map((fileRecord) => createPath(fileRecord.getSchoolId(), fileRecord.id));

	return paths;
}

export function createICopyFiles(sourceFile: FileRecord, targetFile: FileRecord): ICopyFiles {
	const iCopyFiles = {
		sourcePath: createPath(sourceFile.getSchoolId(), sourceFile.id),
		targetPath: createPath(targetFile.getSchoolId(), targetFile.id),
	};

	return iCopyFiles;
}
