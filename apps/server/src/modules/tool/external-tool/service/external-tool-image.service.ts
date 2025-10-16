import { FileApi, FileRecordParentType, FileRecordResponse, StorageLocation } from '@infra/files-storage-client';
import { type Instance, InstanceService } from '@modules/instance';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AxiosResponse } from 'axios';
import { FileRecordRef } from '../domain';

@Injectable()
export class ExternalToolImageService {
	constructor(private readonly fileApi: FileApi, private readonly instanceService: InstanceService) {}

	public async uploadImageFileFromUrl(
		url: string,
		fileNameAffix: string,
		externalToolId: EntityId
	): Promise<FileRecordRef> {
		const fileName = `external-tool-${fileNameAffix}-${externalToolId}`;

		const instance: Instance = await this.instanceService.getInstance();

		const response: AxiosResponse<FileRecordResponse> = await this.fileApi.uploadFromUrl(
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
			fileRecordId: response.data.id,
		});
	}

	public async deleteImageFile(fileRecordId: EntityId): Promise<void> {
		await this.fileApi.deleteFile(fileRecordId);
	}

	public async deleteAllFiles(externalToolId: EntityId): Promise<void> {
		const instance: Instance = await this.instanceService.getInstance();

		await this.fileApi.deleteByParent(
			instance.id,
			StorageLocation.INSTANCE,
			externalToolId,
			FileRecordParentType.EXTERNALTOOLS
		);
	}
}
