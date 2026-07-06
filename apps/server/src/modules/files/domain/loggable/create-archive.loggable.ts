import { Loggable, LoggableMessage } from '@shared/common/loggable';
import util from 'node:util';
import { FileDo } from '../do';

export class CreateArchiveLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly action: string,
		private readonly files: FileDo[],
		private readonly error?: unknown
	) {}

	public getLogMessage(): LoggableMessage {
		let serializedError: string | undefined;
		if (this.error instanceof Error) {
			serializedError = this.error.message;
		} else if (this.error !== undefined) {
			serializedError = util.inspect(this.error);
		}

		const log = {
			message: this.message,
			data: {
				action: this.action,
				fileIds: this.files.map((file) => file.id).join(','),
				...(serializedError !== undefined && { error: serializedError }),
			},
		};

		return log;
	}
}
