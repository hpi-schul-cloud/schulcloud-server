import { AmqpConnection, Nack } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@infra/logger';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { type Channel, type ConsumeMessage } from 'amqplib';
import { isMongoId } from 'class-validator';
import { BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN, BoardImportExchangeConfig } from '../board-import-exchange.config';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from '../board-import.config';
import { BoardImportJobProcessService } from '../domain';
import { type BoardImportJobMessage } from './board-import-job.message';
import { BoardImportEvents } from './board-import.exchange';

const MILLISECONDS_PER_SECOND = 1000;

@Injectable()
export class BoardImportJobConsumer implements OnModuleInit {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject(BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN) private readonly exchangeConfig: BoardImportExchangeConfig,
		@Inject(BOARD_IMPORT_CONFIG_TOKEN) private readonly config: BoardImportConfig,
		private readonly boardImportJobProcessService: BoardImportJobProcessService,
		private readonly orm: MikroORM,
		private readonly logger: Logger
	) {}

	public async onModuleInit(): Promise<void> {
		// The broker gets the acknowledgement when the handler resolves without a Nack.
		await this.amqpConnection.createSubscriber<BoardImportJobMessage>(
			(message) => this.handleMessage(message),
			{
				exchange: this.exchangeConfig.exchangeName,
				routingKey: BoardImportEvents.IMPORT_JOB,
				queue: BoardImportEvents.IMPORT_JOB,
				errorHandler: (channel, message) => this.dropMessageAfterLibraryError(channel, message),
			},
			BoardImportJobConsumer.name
		);
	}

	public async handleMessage(message: BoardImportJobMessage | undefined): Promise<void | Nack> {
		const jobId = message?.jobId;

		// A message without a valid job id can never succeed, so it must not go back to the queue.
		if (typeof jobId !== 'string' || !isMongoId(jobId)) {
			this.logger.warning('Board import job message without valid job id dropped');

			return;
		}

		try {
			await RequestContext.create(this.orm.em, () => this.boardImportJobProcessService.process(jobId));
		} catch {
			// The error can contain contents or links of the source. It is not logged, and it is not thrown,
			// because the RabbitMQ library logs each error that a handler throws.
			this.logger.warning('Board import job goes back to the queue', { jobId });
			await this.waitForRetryDelay();
			const requeue = new Nack(true);

			return requeue;
		}
	}

	// The handler does not throw, so the library calls this only for a message that is not JSON or for an acknowledgement
	// on a channel that closed during the import. A requeue would loop without end, and an error thrown here stops the worker.
	private dropMessageAfterLibraryError(channel: Channel, message: ConsumeMessage): void {
		try {
			channel.ack(message);
		} catch {
			this.logger.warning('Board import job message not acknowledged because the channel is closed');
		}
	}

	// The delay keeps a job that fails at once from going around between broker and worker without a pause.
	private async waitForRetryDelay(): Promise<void> {
		const delayInMs = this.config.jobRetryDelayInSeconds * MILLISECONDS_PER_SECOND;

		await new Promise((resolve) => {
			setTimeout(resolve, delayInMs);
		});
	}
}
