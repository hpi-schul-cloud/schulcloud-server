import { InternalServerErrorException } from '@nestjs/common';
import { FileRecordParams } from '../../api/dto';
import { FileRecordEntity } from '../../repo';
import { PreviewOutputMimeTypes } from '../interface';

export function markForDelete(fileRecords: FileRecordEntity[]): FileRecordEntity[] {
	const markedFileRecords = fileRecords.map((fileRecord) => {
		fileRecord.markForDelete();
		return fileRecord;
	});

	return markedFileRecords;
}

export function unmarkForDelete(fileRecords: FileRecordEntity[]): FileRecordEntity[] {
	const unmarkedFileRecords = fileRecords.map((fileRecord) => {
		fileRecord.unmarkForDelete();
		return fileRecord;
	});

	return unmarkedFileRecords;
}

// TODO: Move/create Factory
export function createFileRecord(
	name: string,
	size: number,
	mimeType: string,
	params: FileRecordParams,
	userId: string
): FileRecordEntity {
	const entity = new FileRecordEntity({
		size,
		name,
		mimeType,
		parentType: params.parentType,
		parentId: params.parentId,
		creatorId: userId,
		storageLocationId: params.storageLocationId,
		storageLocation: params.storageLocation,
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

export function getPreviewName(fileRecord: FileRecordEntity, outputFormat?: PreviewOutputMimeTypes): string {
	const { fileNameWithoutExtension, name } = fileRecord;

	if (!outputFormat) {
		return name;
	}

	const format = getFormat(outputFormat);
	const previewFileName = `${fileNameWithoutExtension}.${format}`;

	return previewFileName;
}
