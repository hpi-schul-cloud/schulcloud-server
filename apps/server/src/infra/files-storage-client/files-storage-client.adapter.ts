import { AxiosErrorLoggable } from '@core/error/loggable';
import { ErrorLogger, Logger } from '@core/logger';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';
import { Stream } from 'stream';
import util from 'util';
import { InternalFilesStorageClientConfig } from './files-storage-client.config';
import { Configuration, FileApi, FileRecordParentType, FileRecordResponse, StorageLocation } from './generated';
import { GenericFileStorageLoggable } from './loggables';

@Injectable()
export class FilesStorageClientAdapter {
	constructor(
		private readonly logger: Logger,
		private readonly errorLogger: ErrorLogger,
		// these should be removed when the generated client supports downloading files as arraybuffer
		private readonly httpService: HttpService,
		private readonly config: InternalFilesStorageClientConfig
	) {
		this.logger.setContext(FilesStorageClientAdapter.name);
	}

	public async getFileRecord(jwt: string, fileRecordId: string): Promise<FileRecordResponse> {
		const response = await this.fileApi(jwt).getFileRecord(fileRecordId);
		const { data } = response;

		return data;
	}

	public async getStream(jwt: string, fileRecordId: string, fileName: string): Promise<Stream | null> {
		try {
			// Originally used with arraybuffer type:
			// INFO: we need to stream the file from the files storage service without using the generated client,
			// because the generated client does not support downloading files as streams. Otherwise files with
			// binary content would be corrupted like pdfs, zip files, etc. Setting the responseType to 'stream'
			// will not work with the generated client.
			// const response = await this.api.download(fileRecordId, fileName, undefined, {
			// 	responseType: 'stream',
			// });

			const url = new URL(`/api/v3/file/download/${fileRecordId}/${fileName}`, this.config.basePath);
			const observable = this.httpService.get(url.toString(), {
				responseType: 'stream',
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			});

			const response = await lastValueFrom(observable);
			return FilesStorageClientAdapter.isStream(response.data) ? response.data : null;
		} catch (error: unknown) {
			if (error instanceof AxiosError) {
				this.errorLogger.error(new AxiosErrorLoggable(error, 'FilesStorageClientAdapter.getStream'));
			} else {
				this.errorLogger.error(
					new GenericFileStorageLoggable(`An unknown error occurred in FilesStorageClientAdapter.getStream`, {
						error: util.inspect(error),
					})
				);
			}

			return null;
		}
	}

	private static isStream(obj: unknown): obj is Stream {
		return obj !== null && typeof obj === 'object' && 'pipe' in obj && typeof obj.pipe === 'function';
	}

	public async upload(
		jwt: string,
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

			const formData = new FormData();

			formData.append('storageLocationId', storageLocationId);
			formData.append('storageLocation', storageLocation);
			formData.append('parentId', parentId);
			formData.append('parentType', parentType);
			formData.append('file', file);

			const url = new URL(
				`/api/v3/file/upload/${storageLocation}/${storageLocationId}/${parentType}/${parentId}`,
				this.config.basePath
			);

			const observable = this.httpService.post(url.toString(), formData, {
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			});
			const response = await lastValueFrom(observable);

			return response.data as FileRecordResponse;
		} catch (error: unknown) {
			if (error instanceof AxiosError) {
				this.errorLogger.error(new AxiosErrorLoggable(error, 'FilesStorageClientAdapter.upload'));
			} else {
				this.errorLogger.error(
					new GenericFileStorageLoggable(`An unknown error occurred in FilesStorageClientAdapter.upload`, {
						error: util.inspect(error),
					})
				);
			}

			return null;
		}
	}

	public async deleteFile(jwt: string, fileRecordId: string): Promise<void> {
		await this.fileApi(jwt).deleteFile(fileRecordId);
	}

	private fileApi(jwt: string): FileApi {
		const { basePath } = this.config;

		const config = new Configuration({
			accessToken: jwt,
			basePath: `${basePath}/api/v3`,
		});

		return new FileApi(config);
	}
}
