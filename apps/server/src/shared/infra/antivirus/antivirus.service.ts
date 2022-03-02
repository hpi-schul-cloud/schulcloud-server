import { Injectable, Inject } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { FileRecord } from '@shared/domain';

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
			const downloadUri = `${this.options.filesServiceBaseUrl}/api/v3/files-storage/downloadBySecurityCheckRequestToken?token=${fileRecord.securityCheck.requestToken}`;
			const callbackUri = `${this.options.filesServiceBaseUrl}/api/v3/files-storage/updateSecurityStatus?token=${fileRecord.securityCheck.requestToken}`;
			await this.amqpConnection.publish(
				this.options.exchange,
				this.options.routingKey,
				{ download_uri: downloadUri, callback_uri: callbackUri },
				{ persistent: true }
			);
		}
	}
}
