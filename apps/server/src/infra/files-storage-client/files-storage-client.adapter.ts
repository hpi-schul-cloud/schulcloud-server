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
import { FileApi } from './generated';

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
			const token = JwtExtractor.extractJwtFromRequest(this.req);
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
}
