import type { FileRecordResponse } from '@modules/files-storage/controller/dto';
import { FileRecordParentType, StorageLocation } from '@modules/files-storage/interface';
import { type Instance, InstanceService } from '@modules/instance';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId } from '@shared/domain/types';
import { AxiosResponse } from 'axios';
import { firstValueFrom, Observable } from 'rxjs';
import { ToolConfig } from '../../tool-config';
import { FileRecordRef } from '../domain';

@Injectable()
export class ExternalToolImageService {
	private readonly internalFileApiUrl: string;

	constructor(
		private readonly configService: ConfigService<ToolConfig, true>,
		private readonly httpService: HttpService,
		private readonly instanceService: InstanceService
	) {
		this.internalFileApiUrl = this.configService.get('FILES_STORAGE__SERVICE_BASE_URL');
	}

	public async uploadImageFileFromUrl(
		url: string,
		fileNameAffix: string,
		externalToolId: EntityId,
		jwt: string
	): Promise<FileRecordRef> {
		const fileName = `external-tool-${fileNameAffix}-${externalToolId}`;

		const instance: Instance = await this.instanceService.getInstance();

		const observable: Observable<AxiosResponse<FileRecordResponse>> = this.httpService.post(
			`${this.internalFileApiUrl}/api/v3/file/upload-from-url/${StorageLocation.INSTANCE}/${instance.id}/${FileRecordParentType.ExternalTool}/${externalToolId}`,
			{
				url,
				fileName,
			},
			{
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			}
		);

		const response: AxiosResponse<FileRecordResponse> = await firstValueFrom(observable);

		return new FileRecordRef({
			uploadUrl: url,
			fileName,
			fileRecordId: response.data.id,
		});
	}

	public async deleteImageFile(fileRecordId: EntityId, jwt: string): Promise<void> {
		const observable: Observable<AxiosResponse<unknown>> = this.httpService.delete(
			`${this.internalFileApiUrl}/api/v3/file/delete/${fileRecordId}`,
			{
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			}
		);

		await firstValueFrom(observable);
	}

	public async deleteAllFiles(externalToolId: EntityId, jwt: string): Promise<void> {
		const instance: Instance = await this.instanceService.getInstance();

		const observable: Observable<AxiosResponse<unknown>> = this.httpService.delete(
			`${this.internalFileApiUrl}/api/v3/file/delete/${StorageLocation.INSTANCE}/${instance.id}/${FileRecordParentType.ExternalTool}/${externalToolId}`,
			{
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			}
		);

		await firstValueFrom(observable);
	}
}
