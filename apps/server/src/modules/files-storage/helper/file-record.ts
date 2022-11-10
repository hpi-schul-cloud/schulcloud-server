import { FileRecordParams } from '../controller/dto';
import { FileRecord } from '../entity';

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
	});

	return entity;
}
