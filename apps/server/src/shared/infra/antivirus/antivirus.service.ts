import { Injectable, Inject } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import {FileRecord} from "@shared/domain";
import {options} from "tsconfig-paths/lib/options";

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
		if (this.options.enabled) {
			let download_uri = this.options.filesServiceBaseUrl + '/api/v3/files-storage/downloadBySecurityCheckRequestToken?token='+ fileRecord.securityCheck?.requestToken;
            let callback_uri = this.options.filesServiceBaseUrl + '/api/v3/files-storage/updateSecurityStatus?token=' + fileRecord.securityCheck?.requestToken;
            await this.amqpConnection.publish(this.options.exchange, this.options.routingKey, {download_uri, callback_uri}, { persistent: true });
		}
	}
}
