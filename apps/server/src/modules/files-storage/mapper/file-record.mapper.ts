import { FileRecord } from '@shared/domain';
import { FileRecordListResponse, FileRecordResponse } from '../controller/dto';

export class FilesStorageMapper {
	static mapToFileRecordResponse(fileRecord: FileRecord): FileRecordResponse {
		return new FileRecordResponse(fileRecord);
	}

	static mapToFileRecordListResponse(
		fileRecords: FileRecord[],
		total: number,
		skip?: number,
		limit?: number
	): FileRecordListResponse {
		const responseFileRecords = fileRecords.map((fileRecord) => {
			return FilesStorageMapper.mapToFileRecordResponse(fileRecord);
		});

		const response = new FileRecordListResponse(responseFileRecords, total, skip, limit);
		return response;
	}
}
