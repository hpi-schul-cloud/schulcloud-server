import { FileRecord, StorageLocationParams } from '../../domain';
import { DeleteByStorageLocationResponse, FileRecordListResponse, FileRecordResponse } from '../dto';

export class FileRecordMapper {
	public static mapToFileRecordResponse(fileRecord: FileRecord): FileRecordResponse {
		const fileRecordResponse = new FileRecordResponse(fileRecord);

		return fileRecordResponse;
	}

	public static mapToFileRecordListResponse(
		fileRecords: FileRecord[],
		total: number,
		skip?: number,
		limit?: number
	): FileRecordListResponse {
		const responseFileRecords = fileRecords.map((fileRecord) => FileRecordMapper.mapToFileRecordResponse(fileRecord));
		const response = new FileRecordListResponse(responseFileRecords, total, skip, limit);

		return response;
	}

	public static mapToDeleteByStorageLocationResponse(
		params: StorageLocationParams,
		deletedFiles: number
	): DeleteByStorageLocationResponse {
		const response = new DeleteByStorageLocationResponse({ ...params, deletedFiles });

		return response;
	}
}
