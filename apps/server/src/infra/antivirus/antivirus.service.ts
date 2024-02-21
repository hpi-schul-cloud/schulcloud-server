import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ErrorUtils } from '@src/core/error/utils';
import { API_VERSION_PATH, FilesStorageInternalActions } from '@modules/files-storage/files-storage.const';
import NodeClam from 'clamscan';
import { Readable } from 'stream';
import { AntivirusServiceOptions, ScanResult } from './interfaces';

@Injectable()
export class AntivirusService {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject('ANTIVIRUS_SERVICE_OPTIONS') private readonly options: AntivirusServiceOptions,
		private readonly clamConnection: NodeClam
	) {}

	public async checkStream(stream: Readable) {
		const scanResult: ScanResult = {
			virus_detected: undefined,
			virus_signature: undefined,
			error: undefined,
		};
		try {
			const { isInfected, viruses } = await this.clamConnection.scanStream(stream);
			if (isInfected === true) {
				scanResult.virus_detected = true;
				scanResult.virus_signature = viruses.join(',');
			} else if (isInfected === null) {
				scanResult.virus_detected = undefined;
				scanResult.error = '';
			} else {
				scanResult.virus_detected = false;
			}
		} catch (err) {
			throw new InternalServerErrorException(
				null,
				ErrorUtils.createHttpExceptionOptions(err, 'AntivirusService:checkStream')
			);
		}

		return scanResult;
	}

	public async send(requestToken: string | undefined): Promise<void> {
		try {
			if (this.options.enabled && requestToken) {
				const downloadUri = this.getUrl(FilesStorageInternalActions.downloadBySecurityToken, requestToken);
				const callbackUri = this.getUrl(FilesStorageInternalActions.updateSecurityStatus, requestToken);

				await this.amqpConnection.publish(
					this.options.exchange,
					this.options.routingKey,
					{ download_uri: downloadUri, callback_uri: callbackUri },
					{ persistent: true }
				);
			}
		} catch (err) {
			throw new InternalServerErrorException(null, ErrorUtils.createHttpExceptionOptions(err, 'AntivirusService:send'));
		}
	}

	private getUrl(path: string, token: string): string {
		const newPath = path.replace(':token', encodeURIComponent(token));
		const url = new URL(`${API_VERSION_PATH}${newPath}`, this.options.filesServiceBaseUrl);

		return url.href;
	}
}
