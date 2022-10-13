import { Injectable } from '@nestjs/common';
import { Counted, EntityId, FileRecord, FileRecordParentType, IPermissionContext } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import {
	FileRecordParams,
	RenameFileParams,
	ScanResultParams,
	SingleFileParams,
} from '../controller/dto/file-storage.params';
import { PermissionContexts } from '../files-storage.const';
import { FileStorageMapper } from '../mapper/parent-type.mapper';
import { FilesStorageService } from '../service/files-storage.service';

@Injectable()
export class FileRecordUC {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly filesStorageService: FilesStorageService
	) {}

	public async patchFilename(userId: EntityId, params: SingleFileParams, data: RenameFileParams) {
		const fileRecord = await this.filesStorageService.getFile(params);
		await this.checkPermission(userId, fileRecord.parentType, fileRecord.parentId, PermissionContexts.update);

		const modifiedFileRecord = await this.filesStorageService.patchFilename(fileRecord, data);

		return modifiedFileRecord;
	}

	public async getFileRecordsOfParent(userId: EntityId, params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		await this.checkPermission(userId, params.parentType, params.parentId, PermissionContexts.read);

		const countedFileRecords = await this.filesStorageService.getFilesOfParent(params);

		return countedFileRecords;
	}

	public async updateSecurityStatus(token: string, scanResultDto: ScanResultParams) {
		// No authorisation is possible atm.
		await this.filesStorageService.updateSecurityStatus(token, scanResultDto);
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
