import { Loggable, LogMessage } from '@src/core/logger';

export class TspSchoolsFetchedLoggable implements Loggable {
	constructor(private readonly tspSchoolCount: number) {}

	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Fetched ${this.tspSchoolCount} schools from TSP`,
			data: {
				tspSchoolCount: this.tspSchoolCount,
			},
		};

		return message;
	}
}
