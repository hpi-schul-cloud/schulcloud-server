import { Injectable } from '@nestjs/common';
import { AxiosErrorLoggable } from '@src/core/error/loggable';
import { ErrorLogger } from '@src/core/logger';
import { AxiosError } from 'axios';
import { FileApi } from './generated';

@Injectable()
export class FilesStorageRestClientAdapter {
	constructor(private readonly api: FileApi, private readonly logger: ErrorLogger) {}

	public async download(fileRecordId: string, fileName: string): Promise<Buffer | null> {
		try {
			const response = await this.api.download(fileRecordId, fileName, undefined, {
				responseType: 'arraybuffer',
			});

			// we can safely cast the response to Buffer because we are using responseType: 'arraybuffer'
			return response.data as unknown as Buffer;
		} catch (error: unknown) {
			this.logger.error(new AxiosErrorLoggable(error as AxiosError, 'FilesStorageRestClientAdapter.download'));

			return null;
		}
	}
}
