import { Loggable, LogMessage, LogMessageData } from '@src/core/logger';

export class AppStartLoggable implements Loggable {
	constructor(private readonly appName: string, private readonly port: number, private readonly mounts?: string) {}

	getLogMessage(): LogMessage {
		const data: LogMessageData = { appName: this.appName, port: this.port };

		if (this.mounts !== undefined) {
			data.mounts = this.mounts;
		}

		return {
			message: 'Successfully started listening...',
			data,
		};
	}
}
