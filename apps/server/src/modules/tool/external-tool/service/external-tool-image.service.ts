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
	private readonly internalApiUrl: string;

	constructor(
		private readonly configService: ConfigService<ToolConfig, true>,
		private readonly httpService: HttpService,
		private readonly instanceService: InstanceService
	) {
		this.internalApiUrl = this.configService.get('API_HOST');
	}

	async uploadImageFileFromUrl(url: string, fileNameAffix: string, externalToolId: EntityId): Promise<FileRecordRef> {
		const fileName = `external-tool-${fileNameAffix}-${externalToolId}`;

		const instance: Instance = await this.instanceService.getInstance();

		const observable: Observable<AxiosResponse<FileRecordResponse>> = this.httpService.post(
			`${this.internalApiUrl}/v3/file/upload-from-url/${StorageLocation.INSTANCE}/${instance.id}/${FileRecordParentType.ExternalTool}/${externalToolId}`,
			{
				url,
				fileName,
			}
		);

		const response: AxiosResponse<FileRecordResponse> = await firstValueFrom(observable);

		return new FileRecordRef({
			uploadUrl: url,
			fileName,
			fileRecordId: response.data.id,
		});
	}

	async deleteImageFile(fileRecordId: EntityId): Promise<void> {
		const observable: Observable<AxiosResponse<unknown>> = this.httpService.post(
			`${this.internalApiUrl}/v3/file/delete/${fileRecordId}`
		);

		await firstValueFrom(observable);
	}

	async deleteAllFiles(externalToolId: EntityId): Promise<void> {
		const instance: Instance = await this.instanceService.getInstance();

		const observable: Observable<AxiosResponse<unknown>> = this.httpService.post(
			`${this.internalApiUrl}/v3/file/delete/${StorageLocation.INSTANCE}/${instance.id}/${FileRecordParentType.ExternalTool}/${externalToolId}`
		);

		await firstValueFrom(observable);
	}
}
