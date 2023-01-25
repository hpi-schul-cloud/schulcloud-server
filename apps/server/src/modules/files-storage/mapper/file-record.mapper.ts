import { FileRecordListResponse, FileRecordResponse } from '../controller/dto';
import { FileRecord } from '../entity';

export class FileRecordMapper {
	static mapToFileRecordResponse(fileRecord: FileRecord): FileRecordResponse {
		return new FileRecordResponse(fileRecord);
	}

	static mapToFileRecordListResponse(
		fileRecords: FileRecord[],
		total: number,
		skip?: number,
		limit?: number
	): FileRecordListResponse {
		const responseFileRecords = fileRecords.map((fileRecord) => FileRecordMapper.mapToFileRecordResponse(fileRecord));

		const response = new FileRecordListResponse(responseFileRecords, total, skip, limit);
		return response;
	}
}
