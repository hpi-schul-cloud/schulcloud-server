import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
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
import { LegacyFileResponse, SecurityCheckStatus } from './types';
import { AuthorizationTokenVo, LegacyFileResponseVo, SignedUrlResponseVO } from './vo';

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

	public async downloadFile(fileId: EntityId, fileName: string): Promise<Readable> {
		const signedUrlResponse = await this.getSignedUrl(fileId, fileName);
		const { url } = signedUrlResponse;
		try {
			const response = await firstValueFrom(this.httpService.get<Readable>(url, { responseType: 'stream' }));

			return response.data;
		} catch (error) {
			throw new InternalServerErrorException(
				`Failed to download file from legacy storage with id ${fileId} and name ${fileName}`,
				{ cause: error }
			);
		}
	}

	private async getSignedUrl(fileId: EntityId, fileName: string): Promise<SignedUrlResponseVO> {
		// The file name needs to be encoded twice to be correctly parsed by the S3 API.
		const encodedFileName = encodeURI(encodeURIComponent(fileName));

		try {
			const responseData = await firstValueFrom(
				this.httpService.get<{ url: string }>(`${this.config.legacyBaseUrl}/fileStorage/signedUrl`, {
					params: { file: fileId, download: true, name: encodedFileName },
					headers: this.getAuthorizationHeader(),
				})
			);

			const signedUrlResponse = new SignedUrlResponseVO(responseData.data.url);

			return signedUrlResponse;
		} catch (error) {
			throw new InternalServerErrorException(
				`Failed to get signed URL for file with id ${fileId} and name ${fileName}`,
				{ cause: error }
			);
		}
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
		TypeGuard.checkArray(data);
		const fileResponses = data
			.map((item) => {
				if (item.securityCheck?.status !== SecurityCheckStatus.BLOCKED) {
					return new LegacyFileResponseVo(item);
				}
			})
			.filter((item) => item !== undefined);

		return fileResponses;
	}

	private async getFiles(ownerId: EntityId, parentId?: EntityId): Promise<AxiosResponse<LegacyFileResponse[]>> {
		const params: Record<string, string> = { owner: ownerId };

		if (parentId !== undefined) {
			params.parent = parentId;
		}

		try {
			const response = await firstValueFrom(
				this.httpService.get(`${this.config.legacyBaseUrl}/fileStorage`, {
					params,
					headers: this.getAuthorizationHeader(),
				})
			);

			return response;
		} catch (error) {
			throw new InternalServerErrorException(`Failed to fetch files for owner with id ${ownerId}`, { cause: error });
		}
	}

	private getAuthorizationHeader(): Record<string, string> {
		const jwtString = JwtExtractor.extractJwtFromRequestOrFail(this.request);
		const authorizationHeaderVo = new AuthorizationTokenVo(jwtString);

		return { authorization: `Bearer ${authorizationHeaderVo.jwt}` };
	}
}
