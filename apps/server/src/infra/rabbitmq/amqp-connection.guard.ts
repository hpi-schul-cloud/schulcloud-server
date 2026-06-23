import { Logger } from '@core/logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AmqpConnectionLostLoggable } from './loggable';

@Injectable()
export class AmqpConnectionGuard implements OnModuleInit {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		private readonly logger: Logger
	) {
		this.logger.setContext(AmqpConnectionGuard.name);
	}

	public onModuleInit(): void {
		this.setupConnectionListeners();
	}

	private setupConnectionListeners(): void {
		const connectionManager = this.amqpConnection.managedConnection;

		connectionManager.on('disconnect', (event: { err?: Error }) => {
			const error = event.err ?? new Error('Unknown disconnect error');
			this.handleConnectionLost(error);
		});

		connectionManager.on('connectFailed', (event: { err?: Error }) => {
			const error = event.err ?? new Error('Failed to connect to AMQP server');
			this.handleConnectionLost(error);
		});
	}

	private handleConnectionLost(error: Error): void {
		this.logger.warning(new AmqpConnectionLostLoggable(error));
		process.exit(1);
	}
}
