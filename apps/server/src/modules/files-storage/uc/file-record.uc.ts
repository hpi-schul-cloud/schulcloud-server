import { Injectable } from '@nestjs/common';
import { FileRecordRepo } from '@shared/repo';
import { Counted, EntityId, FileRecord, ScanStatus } from '@shared/domain';
import { FileParams, ScanResultDto } from '../controller/dto/file-storage.params';

@Injectable()
export class FileRecordUC {
	constructor(private readonly fileRecordRepo: FileRecordRepo) {}

	async fileRecordsOfParent(userId: EntityId, params: FileParams): Promise<Counted<FileRecord[]>> {
		const countedFileRecords = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);

		return countedFileRecords;
	}

	async updateSecurityStatus(token: string, scanResultDto: ScanResultDto) {
		const entity = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);
		const status = scanResultDto.virus_detected ? ScanStatus.BLOCKED : ScanStatus.VERIFIED;
		entity.updateSecurityCheckStatus(status, scanResultDto.virus_signature);
		await this.fileRecordRepo.save(entity);
	}
}
