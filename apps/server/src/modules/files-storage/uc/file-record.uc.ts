import { ConflictException, Injectable } from '@nestjs/common';
import { Actions, Counted, EntityId, FileRecord, ScanStatus } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import {
	FileRecordParams,
	RenameFileParams,
	ScanResultParams,
	SingleFileParams,
} from '../controller/dto/file-storage.params';

@Injectable()
export class FileRecordUC {
	constructor(
		private readonly fileRecordRepo: FileRecordRepo,
		private readonly authorizationService: AuthorizationService
	) {}

	async patchFilename(userId: EntityId, params: SingleFileParams, data: RenameFileParams) {
		const entity = await this.fileRecordRepo.findOneById(params.fileRecordId);
		const currentUser = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkPermission(currentUser, entity, Actions.write);

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
		await this.authorizationService.checkPermissionByReferences(
			userId,
			params.parentType as unknown as never,
			params.parentId,
			Actions.write
		);

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
