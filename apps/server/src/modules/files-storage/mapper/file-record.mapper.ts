import {
	DeleteByStorageLocationResponse,
	FileRecordListResponse,
	FileRecordResponse,
	ScanResultDto,
	ScanResultParams,
} from '../controller/dto';
import { FileRecord, ScanStatus } from '../entity';
import { StorageLocationParams } from '../interface';

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

	public static mapScanResultParamsToDto(scanResultParams: ScanResultParams): ScanResultDto {
		if (scanResultParams.virus_detected) {
			return this.blockedResult(scanResultParams.virus_signature);
		} else if (scanResultParams.error) {
			return this.errorResult(scanResultParams.error);
		} else if (scanResultParams.virus_detected === undefined || scanResultParams.error === '') {
			return this.noScanResult();
		} else {
			return this.verifiedResult();
		}
	}

	private static verifiedResult(): ScanResultDto {
		return new ScanResultDto({
			status: ScanStatus.VERIFIED,
			reason: 'Clean',
		});
	}

	private static blockedResult(virus_signature?: string): ScanResultDto {
		return new ScanResultDto({
			status: ScanStatus.BLOCKED,
			reason: virus_signature ?? 'Virus detected',
		});
	}

	private static errorResult(error: string): ScanResultDto {
		return new ScanResultDto({
			status: ScanStatus.ERROR,
			reason: error,
		});
	}

	private static noScanResult(): ScanResultDto {
		return new ScanResultDto({
			status: ScanStatus.ERROR,
			reason: 'No scan result',
		});
	}

	public static mapToDeleteByStorageLocationResponse(
		params: StorageLocationParams,
		deletedFiles: number
	): DeleteByStorageLocationResponse {
		const response = new DeleteByStorageLocationResponse({ ...params, deletedFiles });

		return response;
	}
}
