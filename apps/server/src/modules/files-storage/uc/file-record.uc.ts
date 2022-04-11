import { ConflictException, Injectable } from '@nestjs/common';
import { FileRecordRepo } from '@shared/repo';
import { Counted, EntityId, FileRecord, ScanStatus } from '@shared/domain';
import {
	FileRecordParams,
	SingleFileParams,
	ScanResultParams,
	RenameFileParams,
} from '../controller/dto/file-storage.params';

@Injectable()
export class FileRecordUC {
	constructor(private readonly fileRecordRepo: FileRecordRepo) {}

	async patchFilename(userId: EntityId, params: SingleFileParams, data: RenameFileParams) {
		const entity = await this.fileRecordRepo.findOneById(params.fileRecordId);
		const [fileRecords] = await this.fileRecordRepo.findBySchoolIdAndParentId(entity.schoolId, entity.parentId);
		if (fileRecords.find((item) => item.name === data.fileName)) {
			throw new ConflictException('FILE_NAME_EXISTS');
		} else {
			entity.name = data.fileName;
			await this.fileRecordRepo.save(entity);
		}
		return entity;
	}

	async fileRecordsOfParent(userId: EntityId, params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		const countedFileRecords = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);

		return countedFileRecords;
	}

	async updateSecurityStatus(token: string, scanResultDto: ScanResultParams) {
		const entity = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);
		const status = scanResultDto.virus_detected ? ScanStatus.BLOCKED : ScanStatus.VERIFIED;
		entity.updateSecurityCheckStatus(status, scanResultDto.virus_signature);

		await this.fileRecordRepo.save(entity);
	}
}
