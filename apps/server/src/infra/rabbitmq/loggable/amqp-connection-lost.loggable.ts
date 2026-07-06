import { ErrorLogMessage } from '@shared/common/error';
import { Loggable } from '@shared/common/loggable';

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
