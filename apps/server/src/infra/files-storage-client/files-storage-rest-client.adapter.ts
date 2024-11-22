import { Injectable } from '@nestjs/common';
import { AxiosErrorLoggable } from '@src/core/error/loggable';
import { ErrorLogger, Logger } from '@src/core/logger';
import { AxiosError } from 'axios';
import { FileApi } from './generated';

@Injectable()
export class FilesStorageRestClientAdapter {
	constructor(
		private readonly api: FileApi,
		private readonly logger: Logger,
		private readonly errorLogger: ErrorLogger
	) {}

	public async download(fileRecordId: string, fileName: string): Promise<Buffer | null> {
		try {
			const response = await this.api.download(fileRecordId, fileName, undefined, {
				responseType: 'arraybuffer',
			});

			this.logger.warning({
				getLogMessage() {
					return {
						message: 'File downloaded',
						fileRecordId,
						response: response as unknown as string,
					};
				},
			});

			// we can safely cast the response to Buffer because we are using responseType: 'arraybuffer'
			return response.data as unknown as Buffer;
		} catch (error: unknown) {
			this.errorLogger.error(new AxiosErrorLoggable(error as AxiosError, 'FilesStorageRestClientAdapter.download'));

			return null;
		}
	}
}
