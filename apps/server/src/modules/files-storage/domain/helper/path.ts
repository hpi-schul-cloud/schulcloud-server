import { CopyFiles } from '@infra/s3-client';
import { FileRecord } from '../file-record.do';

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
