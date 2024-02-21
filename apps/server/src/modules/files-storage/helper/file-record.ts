import { InternalServerErrorException } from '@nestjs/common';
import { FileRecordParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { PreviewOutputMimeTypes } from '../interface';

export function markForDelete(fileRecords: FileRecord[]): FileRecord[] {
	const markedFileRecords = fileRecords.map((fileRecord) => {
		fileRecord.markForDelete();
		return fileRecord;
	});

	return markedFileRecords;
}

export function unmarkForDelete(fileRecords: FileRecord[]): FileRecord[] {
	const unmarkedFileRecords = fileRecords.map((fileRecord) => {
		fileRecord.unmarkForDelete();
		return fileRecord;
	});

	return unmarkedFileRecords;
}

export function createFileRecord(
	name: string,
	size: number,
	mimeType: string,
	params: FileRecordParams,
	userId: string
) {
	const entity = new FileRecord({
		size,
		name,
		mimeType,
		parentType: params.parentType,
		parentId: params.parentId,
		creatorId: userId,
		schoolId: params.schoolId,
		isUploading: true,
	});

	return entity;
}

export function getFormat(mimeType: string): string {
	const format = mimeType.split('/')[1];

	if (!format) {
		throw new InternalServerErrorException(`could not get format from mime type: ${mimeType}`);
	}

	return format;
}

export function getPreviewName(fileRecord: FileRecord, outputFormat?: PreviewOutputMimeTypes): string {
	const { fileNameWithoutExtension, name } = fileRecord;

	if (!outputFormat) {
		return name;
	}

	const format = getFormat(outputFormat);
	const previewFileName = `${fileNameWithoutExtension}.${format}`;

	return previewFileName;
}
