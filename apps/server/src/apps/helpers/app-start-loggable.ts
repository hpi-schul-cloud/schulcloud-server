import { Loggable, LogMessage, LogMessageData } from '@infra/logger';

interface AppStartInfo {
	appName: string;
	port?: number;
	basePath?: string;
	mountsDescription?: string;
}

export class AppStartLoggable implements Loggable {
	constructor(private readonly info: AppStartInfo) {}

	getLogMessage(): LogMessage {
		const data: LogMessageData = { appName: this.info.appName };

		if (this.info.port !== undefined) {
			data.port = this.info.port;
		}

		if (this.info.basePath !== undefined) {
			data.basePath = this.info.basePath;
		}

		if (this.info.mountsDescription !== undefined) {
			data.mountsDescription = this.info.mountsDescription;
		}

		return {
			message: 'Successfully started listening...',
			data,
		};
	}
}
