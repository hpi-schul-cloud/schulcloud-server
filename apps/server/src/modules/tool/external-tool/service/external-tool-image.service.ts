import { FileRecordParentType, FilesStorageClientAdapter, StorageLocation } from '@infra/files-storage-rest-client';
import { type Instance, InstanceService } from '@modules/instance';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { FileRecordRef } from '../domain';

@Injectable()
export class ExternalToolImageService {
	constructor(
		private readonly filesStorageClient: FilesStorageClientAdapter,
		private readonly instanceService: InstanceService
	) {}

	public async uploadImageFileFromUrl(
		url: string,
		fileNameAffix: string,
		externalToolId: EntityId
	): Promise<FileRecordRef> {
		const fileName = `external-tool-${fileNameAffix}-${externalToolId}`;

		const instance: Instance = await this.instanceService.getInstance();

		const response = await this.filesStorageClient.uploadFromUrl(
			instance.id,
			StorageLocation.INSTANCE,
			externalToolId,
			FileRecordParentType.EXTERNALTOOLS,
			{
				url,
				fileName,
			}
		);

		return new FileRecordRef({
			uploadUrl: url,
			fileName,
			fileRecordId: response.id,
		});
	}

	public async deleteImageFile(fileRecordId: EntityId): Promise<void> {
		await this.filesStorageClient.deleteFile(fileRecordId);
	}

	public async deleteAllFiles(externalToolId: EntityId): Promise<void> {
		const instance: Instance = await this.instanceService.getInstance();

		await this.filesStorageClient.deleteByParent(
			instance.id,
			StorageLocation.INSTANCE,
			externalToolId,
			FileRecordParentType.EXTERNALTOOLS
		);
	}
}
