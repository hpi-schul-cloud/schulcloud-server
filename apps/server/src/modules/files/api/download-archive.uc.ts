import { AuthorizationClientAdapter, AuthorizationContextBuilder } from '@infra/authorization-client';
import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { DownloadArchiveService, GetFileResponse } from '../domain';
import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig } from '../legacy-file-archive.config';
import { ArchiveFileParams } from './dto';
import { AuthorizationReferenceTypeMapper } from './mapper';

@Injectable()
export class DownloadArchiveUC {
	constructor(
		private readonly authorizationClientAdapter: AuthorizationClientAdapter,
		private readonly filesStorageService: DownloadArchiveService,
		@Inject(LEGACY_FILE_ARCHIVE_CONFIG_TOKEN) private readonly config: LegacyFileArchiveConfig
	) {}

	public async downloadFilesOfParentAsArchive(params: ArchiveFileParams): Promise<GetFileResponse> {
		this.featureEnabled();

		await this.checkPermission(params);

		const fileResponse = await this.filesStorageService.downloadFilesAsArchive(params.ownerId, params.archiveName);

		return fileResponse;
	}

	private async checkPermission(params: ArchiveFileParams): Promise<void> {
		const { ownerId, ownerType } = params;
		const referenceType = AuthorizationReferenceTypeMapper.mapOwnerTypeToReferenceType(ownerType);
		const context = AuthorizationContextBuilder.read([]);

		await this.authorizationClientAdapter.checkPermissionsByReference(referenceType, ownerId, context);
	}

	private featureEnabled(): void {
		if (!this.config.featureTeamArchiveDownload) {
			throw new NotImplementedException('Feature not enabled');
		}
	}
}
