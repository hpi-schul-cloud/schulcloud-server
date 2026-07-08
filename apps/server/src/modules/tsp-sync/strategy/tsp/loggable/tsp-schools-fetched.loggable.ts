import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class TspSchoolsFetchedLoggable implements Loggable {
	constructor(
		private readonly tspSchoolCount: number,
		private readonly daysFetched: number
	) {}

	public getLogMessage(): LoggableMessage {
		let message: string;
		if (this.daysFetched === -1) {
			message = `Fetched ${this.tspSchoolCount} schools for full sync from TSP`;
		} else {
			message = `Fetched ${this.tspSchoolCount} schools for the last ${this.daysFetched} days from TSP`;
		}

		const logMessage: LoggableMessage = {
			message,
			data: {
				tspSchoolCount: this.tspSchoolCount,
				daysFetched: this.daysFetched,
			},
		};

		return logMessage;
	}
}
