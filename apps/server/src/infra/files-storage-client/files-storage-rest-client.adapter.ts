import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { extractJwtFromRequest } from '@shared/common/utils/jwt';
import { AxiosErrorLoggable } from '@src/core/error/loggable';
import { ErrorLogger, Logger } from '@src/core/logger';
import { AxiosError } from 'axios';
import type { Request } from 'express';
import { lastValueFrom } from 'rxjs';
import { FilesStorageRestClientConfig } from './files-storage-rest-client.config';
import { FileApi } from './generated';

@Injectable()
export class FilesStorageRestClientAdapter {
	constructor(
		private readonly api: FileApi,
		private readonly logger: Logger,
		private readonly errorLogger: ErrorLogger,
		// these should be removed when the generated client supports downloading files as arraybuffer
		private readonly httpService: HttpService,
		private readonly configService: ConfigService<FilesStorageRestClientConfig, true>,
		@Inject(REQUEST) private readonly req: Request
	) {}

	public async download(fileRecordId: string, fileName: string): Promise<Buffer | null> {
		this.logger.warning({
			getLogMessage() {
				return {
					message: `Downloading file ${fileName} with fileRecordId ${fileRecordId}`,
					fileRecordId,
					fileName,
				};
			},
		});

		try {
			// INFO: we need to download the file from the files storage service without using the generated client,
			// because the generated client does not support downloading files as arraybuffer. Otherwise files with
			// binary content would be corrupted like pdfs, zip files, etc. Setting the responseType to 'arraybuffer'
			// will not work with the generated client.
			// const response = await this.api.download(fileRecordId, fileName, undefined, {
			// 	responseType: 'arraybuffer',
			// });
			const token = extractJwtFromRequest(this.req);
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

			this.logger.warning({
				getLogMessage() {
					return {
						message: 'File downloaded',
						fileRecordId,
						response: response as unknown as string,
					};
				},
			});

			const data = Buffer.isBuffer(response.data) ? response.data : null;

			return data;
		} catch (error: unknown) {
			this.errorLogger.error(new AxiosErrorLoggable(error as AxiosError, 'FilesStorageRestClientAdapter.download'));

			return null;
		}
	}
}
