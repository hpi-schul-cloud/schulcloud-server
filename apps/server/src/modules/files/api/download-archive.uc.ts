import { Logger } from '@core/logger';
import { AuthorizationClientAdapter, AuthorizationContextBuilder } from '@infra/authorization-client';
import { Injectable } from '@nestjs/common';
import { ArchiveFileParams } from './dto';
import { AuthorizationReferenceTypeMapper } from './mapper';
import { DownloadArchiveService, GetFileResponse } from '../domain';

@Injectable()
export class DownloadArchiveUC {
	constructor(
		private readonly logger: Logger,
		private readonly authorizationClientAdapter: AuthorizationClientAdapter,
		private readonly filesStorageService: DownloadArchiveService
	) {
		this.logger.setContext(DownloadArchiveUC.name);
	}

	public async downloadFilesOfParentAsArchive(params: ArchiveFileParams): Promise<GetFileResponse> {
		await this.checkPermission(params);

		const fileResponse = await this.filesStorageService.downloadFilesAsArchive(
			params.ownerId,
			params.ownerType,
			params.archiveName
		);

		return fileResponse;
	}

	private async checkPermission(params: ArchiveFileParams): Promise<void> {
		const { ownerId, ownerType } = params;
		const referenceType = AuthorizationReferenceTypeMapper.mapOwnerTypeToReferenceType(ownerType);
		const context = AuthorizationContextBuilder.read([]);

		await this.authorizationClientAdapter.checkPermissionsByReference(referenceType, ownerId, context);
	}
}
