import { FileRecordParams } from '../controller/dto';
import { FileRecordDO, FileRecordDOParams } from '../entity';

export function markForDelete(fileRecords: FileRecordDO[]): void {
	fileRecords.map((fileRecord) => {
		fileRecord.markForDelete();
		return fileRecord;
	});
}

export function unmarkForDelete(fileRecords: FileRecordDO[]): void {
	fileRecords.map((fileRecord) => {
		fileRecord.unmarkForDelete();
		return fileRecord;
	});
}

// TODO: builder
export function getFileRecordParams(
	name: string,
	size: number,
	mimeType: string,
	params: FileRecordParams,
	userId: string
): FileRecordDOParams {
	const props: FileRecordDOParams = {
		size,
		name,
		mimeType,
		parentType: params.parentType,
		parentId: params.parentId,
		creatorId: userId,
		schoolId: params.schoolId,
	};

	return props;
}
