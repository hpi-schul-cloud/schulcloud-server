import { FileRecordParams } from '../controller/dto';
import { FileRecordEntity } from '../entity';

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

export function createFileRecord(
	name: string,
	size: number,
	mimeType: string,
	params: FileRecordParams,
	userId: string
) {
	const entity = new FileRecordEntity({
		size,
		name,
		mimeType,
		parentType: params.parentType,
		parentId: params.parentId,
		creatorId: userId,
		schoolId: params.schoolId,
	});

	return entity;
}
