import { EntityId } from '@shared/domain';
import crypto from 'crypto';
import path from 'path';
import { PreviewParams } from '../controller/dto';
import { FileRecord } from '../entity';

export function hasDuplicateName(fileRecords: FileRecord[], name: string): FileRecord | undefined {
	const foundFileRecord = fileRecords.find((item: FileRecord) => item.hasName(name));

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

export function createPreviewNameHash(fileRecordId: EntityId, previewParams: PreviewParams): string {
	const width = previewParams.width ?? '';
	const format = previewParams.outputFormat ?? '';
	const fileParamsString = `${fileRecordId}${width}${format}`;
	const hash = crypto.createHash('md5').update(fileParamsString).digest('hex');

	return hash;
}
