import { AxiosErrorLoggable } from '@core/error/loggable';
import { ErrorLogger, Logger } from '@core/logger';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils/jwt';
import { AxiosError } from 'axios';
import type { Request } from 'express';
import { lastValueFrom } from 'rxjs';
import { Stream } from 'stream';
import { FilesStorageClientConfig } from './files-storage-client.config';
import { FileApi, FileRecordParentType, FileRecordResponse, StorageLocation } from './generated';

@Injectable()
export class FilesStorageClientAdapter {
	constructor(
		private readonly api: FileApi,
		private readonly logger: Logger,
		private readonly errorLogger: ErrorLogger,
		// these should be removed when the generated client supports downloading files as arraybuffer
		private readonly httpService: HttpService,
		private readonly configService: ConfigService<FilesStorageClientConfig, true>,
		@Inject(REQUEST) private readonly req: Request
	) {
		this.logger.setContext(FilesStorageClientAdapter.name);
	}

	public async getStream(fileRecordId: string, fileName: string): Promise<Stream | null> {
		try {
			// Originally used with arraybuffer type:
			// INFO: we need to stream the file from the files storage service without using the generated client,
			// because the generated client does not support downloading files as streams. Otherwise files with
			// binary content would be corrupted like pdfs, zip files, etc. Setting the responseType to 'stream'
			// will not work with the generated client.
			// const response = await this.api.download(fileRecordId, fileName, undefined, {
			// 	responseType: 'stream',
			// });

			const token = JwtExtractor.extractJwtFromRequestOrFail(this.req);
			const url = new URL(
				`${this.configService.getOrThrow<string>(
					'FILES_STORAGE__SERVICE_BASE_URL'
				)}/api/v3/file/download/${fileRecordId}/${fileName}`
			);
			const observable = this.httpService.get(url.toString(), {
				responseType: 'stream',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const response = await lastValueFrom(observable);

			if (!FilesStorageClientAdapter.isStream(response.data)) {
				return null;
			}

			const stream = response.data;
			return stream;
		} catch (error: unknown) {
			this.errorLogger.error(new AxiosErrorLoggable(error as AxiosError, 'FilesStorageClientAdapter.getStream'));

			return null;
		}
	}

	private static isStream(obj: unknown): obj is Stream {
		return obj !== null && typeof obj === 'object' && 'pipe' in obj && typeof obj.pipe === 'function';
	}

	public async upload(
		storageLocationId: string,
		storageLocation: StorageLocation,
		parentId: string,
		parentType: FileRecordParentType,
		file: File
	): Promise<FileRecordResponse | null> {
		try {
			// INFO: we need to upload the file to the files storage service without using the generated client,
			// because the generated client does not support uploading files as FormData. Otherwise files with
			// binary content would be corrupted like pdfs, zip files, etc.

			const token = JwtExtractor.extractJwtFromRequestOrFail(this.req);

			const formData = new FormData();

			formData.append('storageLocationId', storageLocationId);
			formData.append('storageLocation', storageLocation);
			formData.append('parentId', parentId);
			formData.append('parentType', parentType);
			formData.append('file', file);

			const url = new URL(
				`${this.configService.getOrThrow<string>(
					'FILES_STORAGE__SERVICE_BASE_URL'
				)}/api/v3/file/upload/${storageLocation}/${storageLocationId}/${parentType}/${parentId}`
			);

			const observable = this.httpService.post(url.toString(), formData, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const response = await lastValueFrom(observable);

			return response.data as FileRecordResponse;
		} catch (error: unknown) {
			this.errorLogger.error(new AxiosErrorLoggable(error as AxiosError, 'FilesStorageClientAdapter.upload'));

			return null;
		}
	}
}
