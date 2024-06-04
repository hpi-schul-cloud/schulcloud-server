import { CopyFiles } from '@infra/s3-client';
import { EntityId } from '@shared/domain/types';
import { FileRecord } from '../entity';
import { ErrorType } from '../error';

export function createPath(storageLocationId: EntityId, fileRecordId: EntityId): string {
	if (!storageLocationId || !fileRecordId) {
		throw new Error(ErrorType.COULD_NOT_CREATE_PATH);
	}

	const path = [storageLocationId, fileRecordId].join('/');

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
	const paths = fileRecords.map((fileRecord) => createPath(fileRecord.getStorageLocationId(), fileRecord.id));

	return paths;
}

export function createCopyFiles(sourceFile: FileRecord, targetFile: FileRecord): CopyFiles {
	const copyFiles = {
		sourcePath: createPath(sourceFile.getStorageLocationId(), sourceFile.id),
		targetPath: createPath(targetFile.getStorageLocationId(), targetFile.id),
	};

	return copyFiles;
}
