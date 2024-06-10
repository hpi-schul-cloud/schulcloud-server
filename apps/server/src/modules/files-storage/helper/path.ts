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

export function createPreviewDirectoryPath(storageLocationId: EntityId, sourceFileRecordId: EntityId): string {
	const path = ['previews', storageLocationId, sourceFileRecordId].join('/');

	return path;
}

export function createPreviewFilePath(storageLocationId: EntityId, hash: string, sourceFileRecordId: EntityId): string {
	const folderPath = createPreviewDirectoryPath(storageLocationId, sourceFileRecordId);
	const filePath = [folderPath, hash].join('/');

	return filePath;
}

export function getPaths(fileRecords: FileRecord[]): string[] {
	const paths = fileRecords.map((fileRecord) => createPath(fileRecord.storageLocationId, fileRecord.id));

	return paths;
}

export function createCopyFiles(sourceFile: FileRecord, targetFile: FileRecord): CopyFiles {
	const copyFiles = {
		sourcePath: createPath(sourceFile.storageLocationId, sourceFile.id),
		targetPath: createPath(targetFile.storageLocationId, targetFile.id),
	};

	return copyFiles;
}
