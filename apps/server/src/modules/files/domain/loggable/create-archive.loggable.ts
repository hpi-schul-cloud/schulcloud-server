import { Loggable } from '@core/logger/interfaces';
import { LogMessage } from '@core/logger/types';
import { FileDo } from '../do';

export class CreateArchiveLoggable implements Loggable {
	constructor(private readonly message: string, private readonly action: string, private readonly files: FileDo[]) {}

	public getLogMessage(): LogMessage {
		const log = {
			message: this.message,
			data: {
				action: this.action,
				fileIds: this.files.map((file) => file.id).join(','),
			},
		};

		return log;
	}
}
