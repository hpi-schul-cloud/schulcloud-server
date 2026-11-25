import { AuthorizationClientAdapter, AuthorizationContextBuilder } from '@infra/authorization-client';
import { Injectable } from '@nestjs/common';
import { DownloadArchiveService, FileDo, GetFileResponse } from '../domain';
import { ArchiveFileParams } from './dto';
import { AuthorizationReferenceTypeMapper } from './mapper';

@Injectable()
export class DownloadArchiveUC {
	constructor(
		private readonly authorizationClientAdapter: AuthorizationClientAdapter,
		private readonly filesStorageService: DownloadArchiveService
	) {}

	public async downloadFilesOfParentAsArchive(params: ArchiveFileParams): Promise<GetFileResponse> {
		await this.checkPermission(params);

		const fileResponse = await this.filesStorageService.downloadFilesAsArchive(
			params.ownerId,
			params.archiveName,
			params.selectedFiles
		);

		return fileResponse;
	}

	public async listDownloadableFiles(params: ArchiveFileParams): Promise<FileDo[]> {
		await this.checkPermission(params);

		const fileResponses = await this.filesStorageService.listDownloadableFiles(params.ownerId);

		return fileResponses;
	}

	private async checkPermission(params: ArchiveFileParams): Promise<void> {
		const { ownerId, ownerType } = params;
		const referenceType = AuthorizationReferenceTypeMapper.mapOwnerTypeToReferenceType(ownerType);
		const context = AuthorizationContextBuilder.read([]);

		await this.authorizationClientAdapter.checkPermissionsByReference(referenceType, ownerId, context);
	}
}
