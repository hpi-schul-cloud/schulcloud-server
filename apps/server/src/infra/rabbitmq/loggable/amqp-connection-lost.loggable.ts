import { ErrorLogMessage, Loggable } from '@infra/logger';

export class AmqpConnectionLostLoggable implements Loggable {
	constructor(private readonly error: Error) {}

	public getLogMessage(): ErrorLogMessage {
		return {
			error: this.error,
			type: 'AMQP Connection Lost',
			data: {
				message: 'AMQP connection was lost. The application will shut down.',
			},
		};
	}
}
