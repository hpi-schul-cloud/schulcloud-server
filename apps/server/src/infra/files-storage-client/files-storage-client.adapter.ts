import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils/jwt';
import { AxiosErrorLoggable } from '@core/error/loggable';
import { ErrorLogger, Logger } from '@core/logger';
import { AxiosError } from 'axios';
import type { Request } from 'express';
import { lastValueFrom } from 'rxjs';
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

	public async download(fileRecordId: string, fileName: string): Promise<Buffer | null> {
		try {
			// INFO: we need to download the file from the files storage service without using the generated client,
			// because the generated client does not support downloading files as arraybuffer. Otherwise files with
			// binary content would be corrupted like pdfs, zip files, etc. Setting the responseType to 'arraybuffer'
			// will not work with the generated client.
			// const response = await this.api.download(fileRecordId, fileName, undefined, {
			// 	responseType: 'arraybuffer',
			// });
			const token = JwtExtractor.extractJwtFromRequestOrFail(this.req);
			const url = new URL(
				`${this.configService.getOrThrow<string>(
					'FILES_STORAGE__SERVICE_BASE_URL'
				)}/api/v3/file/download/${fileRecordId}/${fileName}`
			);
			const observable = this.httpService.get(url.toString(), {
				responseType: 'arraybuffer',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const response = await lastValueFrom(observable);
			const data = Buffer.isBuffer(response.data) ? response.data : null;

			return data;
		} catch (error: unknown) {
			this.errorLogger.error(new AxiosErrorLoggable(error as AxiosError, 'FilesStorageClientAdapter.download'));

			return null;
		}
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
			// because the generated client does not support uploading files as FormData.
			// const response = await this.api.upload(storageLocationId, storageLocation, parentId, parentType, file, options);

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
