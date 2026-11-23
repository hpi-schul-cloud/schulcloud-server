import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { type Options } from 'amqplib';
import { BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN, BoardImportExchangeConfig } from '../board-import-exchange.config';
import { type BoardImportJobMessage } from './board-import-job.message';
import { BoardImportEvents } from './board-import.exchange';

// Must stay below the request timeout, so that the job is marked as failed before the request ends.
// A message that timed out can still reach the broker.
export const BOARD_IMPORT_JOB_PUBLISH_TIMEOUT_IN_MS = 5000;

@Injectable()
export class BoardImportJobProducer {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject(BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN) private readonly config: BoardImportExchangeConfig
	) {}

	public async publishJob(message: BoardImportJobMessage, expiresAt: Date): Promise<void> {
		const expiration = Math.max(expiresAt.getTime() - Date.now(), 0);
		const options: Options.Publish & { timeout: number } = {
			persistent: true,
			expiration,
			timeout: BOARD_IMPORT_JOB_PUBLISH_TIMEOUT_IN_MS,
		};

		await this.amqpConnection.publish(this.config.exchangeName, BoardImportEvents.IMPORT_JOB, message, options);
	}
}
