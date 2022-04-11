import { Injectable, Inject } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { FileRecord } from '@shared/domain';
import { API_VERSION_PATH, FilesStorageInternalActions } from '@src/modules/files-storage/files-storage.const';

interface AntivirusServiceOptions {
	enabled: boolean;
	filesServiceBaseUrl: string;
	exchange: string;
	routingKey: string;
}

@Injectable()
export class AntivirusService {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject('ANTIVIRUS_SERVICE_OPTIONS') private readonly options: AntivirusServiceOptions
	) {}

	public async send(fileRecord: FileRecord): Promise<void> {
		if (this.options.enabled && fileRecord.securityCheck.requestToken) {
			const downloadUri = this.getUrl(
				FilesStorageInternalActions.downloadBySecurityToken,
				fileRecord.securityCheck.requestToken
			);
			const callbackUri = this.getUrl(
				FilesStorageInternalActions.updateSecurityStatus,
				fileRecord.securityCheck.requestToken
			);

			await this.amqpConnection.publish(
				this.options.exchange,
				this.options.routingKey,
				{ download_uri: downloadUri, callback_uri: callbackUri },
				{ persistent: true }
			);
		}
	}

	private getUrl(path: string, token: string) {
		const newPath = path.replace(':token', encodeURIComponent(token));
		const url = new URL(`${API_VERSION_PATH}${newPath}`, this.options.filesServiceBaseUrl);
		return url.href;
	}
}
