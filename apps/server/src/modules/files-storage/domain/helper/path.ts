import { CopyFiles } from '@infra/s3-client';
import { EntityId } from '@shared/domain/types';
import { FileRecord } from '../file-record.do';

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
	const paths = fileRecords.map((fileRecord) => fileRecord.createPath());

	return paths;
}

export function createCopyFiles(sourceFile: FileRecord, targetFile: FileRecord): CopyFiles {
	const copyFiles = {
		sourcePath: sourceFile.createPath(),
		targetPath: targetFile.createPath(),
	};

	return copyFiles;
}
