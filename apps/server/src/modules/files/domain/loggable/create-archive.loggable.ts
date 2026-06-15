import { Loggable } from '@core/logger/interfaces';
import { LogMessage } from '@core/logger/types';
import util from 'util';
import { FileDo } from '../do';

export class CreateArchiveLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly action: string,
		private readonly files: FileDo[],
		private readonly error?: unknown
	) {}

	public getLogMessage(): LogMessage {
		const serializedError =
			this.error instanceof Error
				? this.error.message
				: this.error !== undefined
					? util.inspect(this.error)
					: undefined;

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
