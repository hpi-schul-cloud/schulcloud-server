import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN, BoardImportExchangeConfig } from '../board-import-exchange.config';
import { type BoardImportJobMessage } from './board-import-job.message';
import { BoardImportEvents } from './board-import.exchange';

@Injectable()
export class BoardImportJobProducer {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject(BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN) private readonly config: BoardImportExchangeConfig
	) {}

	public async publishJob(message: BoardImportJobMessage): Promise<void> {
		await this.amqpConnection.publish(this.config.exchangeName, BoardImportEvents.IMPORT_JOB, message, {
			persistent: true,
		});
	}
}
