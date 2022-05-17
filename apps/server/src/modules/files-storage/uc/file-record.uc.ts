import { ConflictException, Injectable } from '@nestjs/common';
import { Counted, EntityId, FileRecord, FileRecordParentType, IPermissionContext, ScanStatus } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import {
	FileRecordParams,
	RenameFileParams,
	ScanResultParams,
	SingleFileParams,
} from '../controller/dto/file-storage.params';
import { PermissionContexts } from '../files-storage.const';
import { FileStorageMapper } from '../mapper/parent-type.mapper';

@Injectable()
export class FileRecordUC {
	constructor(
		private readonly fileRecordRepo: FileRecordRepo,
		private readonly authorizationService: AuthorizationService
	) {}

	private checkDuplicatedNames(fileRecords: FileRecord[], data: RenameFileParams): void | ConflictException {
		if (fileRecords.find((item) => item.name === data.fileName)) {
			throw new ConflictException('FILE_NAME_EXISTS');
		}
	}

	private modifiedFileName(
		entity: FileRecord,
		fileRecordsInScope: FileRecord[],
		data: RenameFileParams
	): void | ConflictException {
		this.checkDuplicatedNames(fileRecordsInScope, data);
		entity.name = data.fileName;
	}

	public async patchFilename(userId: EntityId, params: SingleFileParams, data: RenameFileParams) {
		const entity = await this.fileRecordRepo.findOneById(params.fileRecordId);
		await this.checkPermission(userId, entity.parentType, entity.parentId, PermissionContexts.update);

		const [fileRecords] = await this.fileRecordRepo.findBySchoolIdAndParentId(entity.schoolId, entity.parentId);

		this.modifiedFileName(entity, fileRecords, data);
		await this.fileRecordRepo.save(entity);

		return entity;
	}

	public async fileRecordsOfParent(userId: EntityId, params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(userId, params.parentType, params.parentId, PermissionContexts.read);

		const countedFileRecords = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);

		return countedFileRecords;
	}

	private getStatusFromScanResult(scanResultDto: ScanResultParams) {
		const status = scanResultDto.virus_detected ? ScanStatus.BLOCKED : ScanStatus.VERIFIED;

		return status;
	}

	public async updateSecurityStatus(token: string, scanResultDto: ScanResultParams) {
		const entity = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);
		const status = this.getStatusFromScanResult(scanResultDto);
		entity.updateSecurityCheckStatus(status, scanResultDto.virus_signature);

		await this.fileRecordRepo.save(entity);
	}

	private async checkPermission(
		userId: EntityId,
		parentType: FileRecordParentType,
		parentId: EntityId,
		context: IPermissionContext
	) {
		const allowedType = FileStorageMapper.mapToAllowedAuthorizationEntityType(parentType);
		await this.authorizationService.checkPermissionByReferences(userId, allowedType, parentId, context);
	}
}
