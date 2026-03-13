import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TypeGuard } from '@shared/common/guards';
import { JwtExtractor } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { Readable } from 'node:stream';
import { firstValueFrom } from 'rxjs';
import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig } from '../legacy-file-archive.config';
import { FileDo } from './do';
import { FileFactory } from './factory';
import { LegacyFileResponseVo } from './vo';
import { LegacyFileResponse } from './types';

@Injectable()
export class LegacyFileStorageAdapter {
	constructor(
		private readonly httpService: HttpService,
		@Inject(LEGACY_FILE_ARCHIVE_CONFIG_TOKEN) private readonly config: LegacyFileArchiveConfig,
		@Inject(REQUEST) private readonly request: Request
	) {}

	public getFilesForOwner(ownerId: EntityId): Promise<FileDo[]> {
		const files = this.fetchRecursively(ownerId, undefined);

		return files;
	}

	public async getSignedUrl(fileId: EntityId, fileName: string): Promise<string> {
		const responseData = await firstValueFrom(
			this.httpService.get(`${this.config.legacyBaseUrl}/fileStorage/signedUrl`, {
				params: { file: fileId, download: true, name: fileName },
				headers: this.getAuthorizationHeader(),
			})
		);

		const url = this.validateSignedUrlResponse(responseData);

		return url;
	}

	public async downloadFile(fileId: EntityId, fileName: string): Promise<Readable> {
		const signedUrl = await this.getSignedUrl(fileId, fileName);

		const response = await firstValueFrom(this.httpService.get<Readable>(signedUrl, { responseType: 'stream' }));

		return response.data;
	}

	private validateSignedUrlResponse(response: AxiosResponse): string {
		const urlValue = TypeGuard.checkKeyInObject(response.data, 'url');
		const url = TypeGuard.checkString(urlValue);

		return url;
	}

	private async fetchRecursively(ownerId: EntityId, parentId: string | undefined): Promise<FileDo[]> {
		const response = await this.getFiles(ownerId, parentId);
		const fileResponses = this.validateResponse(response);
		const files = this.mapToFileDos(fileResponses);

		const directories = fileResponses.filter((file) => file.isDirectory);
		const filePromises = directories.map((directory) => this.fetchRecursively(ownerId, directory._id));
		const filesFromSubfolders = (await Promise.all(filePromises)).flat();

		return [...files, ...filesFromSubfolders];
	}

	private mapToFileDos(filesResponses: LegacyFileResponseVo[]): FileDo[] {
		return filesResponses.map((fileResponse) => FileFactory.buildFromLegacyFileResponse(fileResponse));
	}

	private validateResponse(response: AxiosResponse<LegacyFileResponse[]>): LegacyFileResponseVo[] {
		const { data } = response;
		const arrayData = TypeGuard.checkArray(data);
		const fileResponses = arrayData.map((item) => new LegacyFileResponseVo(item));

		return fileResponses;
	}

	private async getFiles(ownerId: EntityId, parentId?: EntityId): Promise<AxiosResponse<LegacyFileResponse[]>> {
		const params: Record<string, string> = { owner: ownerId };

		if (parentId !== undefined) {
			params.parent = parentId;
		}

		const response = await firstValueFrom(
			this.httpService.get(`${this.config.legacyBaseUrl}/fileStorage`, {
				params,
				headers: this.getAuthorizationHeader(),
			})
		);

		return response;
	}

	private getAuthorizationHeader(): Record<string, string> {
		const jwt = JwtExtractor.extractJwtFromRequestOrFail(this.request);

		return { authorization: `Bearer ${jwt}` };
	}
}
