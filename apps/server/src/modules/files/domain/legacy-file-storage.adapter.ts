import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TypeGuard } from '@shared/common/guards';
import { JwtExtractor } from '@shared/common/utils';
import { EntityId } from '@shared/domain/types';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig } from '../legacy-file-archive.config';
import { FileDo } from './do';
import { FileFactory, LegacyFileResponse } from './factory';

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

	private async fetchRecursively(ownerId: EntityId, parentId: string | undefined): Promise<FileDo[]> {
		const response = await this.getFiles(ownerId, parentId);
		const rawFiles = this.validateResponse(response);
		const files = this.mapToFileDos(rawFiles);

		const directories = rawFiles.filter((file) => file.isDirectory);
		const filePromises = directories.map((directory) => this.fetchRecursively(ownerId, directory._id));
		const filesFromSubfolders = (await Promise.all(filePromises)).flat();

		return [...files, ...filesFromSubfolders];
	}

	private mapToFileDos(filesResponses: LegacyFileResponse[]): FileDo[] {
		return filesResponses.map((fileResponse) => FileFactory.buildFromLegacyFileResponse(fileResponse));
	}

	private validateResponse(response: AxiosResponse): LegacyFileResponse[] {
		const rawData: unknown = response.data;
		const arrayData = TypeGuard.checkArray(rawData);
		const rawFiles: LegacyFileResponse[] = arrayData.map((item, index) =>
			LegacyFileStorageAdapter.checkLegacyFileResponse(item, index)
		);

		return rawFiles;
	}

	private async getFiles(ownerId: EntityId, parentId?: EntityId): Promise<AxiosResponse> {
		const { legacyBaseUrl } = this.config;
		const jwt = JwtExtractor.extractJwtFromRequestOrFail(this.request);

		const params: Record<string, string> = { owner: ownerId };

		if (parentId !== undefined) {
			params.parent = parentId;
		}

		const response = await firstValueFrom(
			this.httpService.get(`${legacyBaseUrl}/fileStorage`, {
				params,
				headers: { authorization: `Bearer ${jwt}` },
			})
		);

		return response;
	}

	private static checkLegacyFileResponse(value: unknown, index: number): LegacyFileResponse {
		if (!TypeGuard.isDefinedObject(value)) {
			throw new Error(`Unexpected item shape at index ${index} in legacy file storage response`);
		}
		const obj = value as Record<string, unknown>;

		if (
			!TypeGuard.isString(obj._id) ||
			!TypeGuard.isString(obj.name) ||
			!TypeGuard.isBoolean(obj.isDirectory) ||
			(!TypeGuard.isUndefined(obj.parent) && !TypeGuard.isString(obj.parent)) ||
			(!TypeGuard.isUndefined(obj.storageFileName) && !TypeGuard.isString(obj.storageFileName)) ||
			(!TypeGuard.isUndefined(obj.bucket) && !TypeGuard.isString(obj.bucket)) ||
			(!TypeGuard.isUndefined(obj.storageProviderId) && !TypeGuard.isString(obj.storageProviderId))
		) {
			throw new Error(`Unexpected item shape at index ${index} in legacy file storage response`);
		}

		return obj as unknown as LegacyFileResponse;
	}
}
