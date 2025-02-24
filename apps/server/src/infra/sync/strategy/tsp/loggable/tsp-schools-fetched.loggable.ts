import { Loggable, LogMessage } from '@core/logger';

export class TspSchoolsFetchedLoggable implements Loggable {
	constructor(private readonly tspSchoolCount: number, private readonly daysFetched: number) {}

	public getLogMessage(): LogMessage {
		let message: string;
		if (this.daysFetched === -1) {
			message = `Fetched ${this.tspSchoolCount} schools for full sync from TSP`;
		} else {
			message = `Fetched ${this.tspSchoolCount} schools for the last ${this.daysFetched} days from TSP`;
		}

		const logMessage: LogMessage = {
			message,
			data: {
				tspSchoolCount: this.tspSchoolCount,
				daysFetched: this.daysFetched,
			},
		};

		return logMessage;
	}
}
