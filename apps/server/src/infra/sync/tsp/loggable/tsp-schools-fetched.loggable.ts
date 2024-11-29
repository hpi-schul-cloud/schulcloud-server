import { Loggable, LogMessage } from '../../../../core/logger';

export class TspSchoolsFetchedLoggable implements Loggable {
	constructor(private readonly tspSchoolCount: number, private readonly daysFetched: number) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Fetched ${this.tspSchoolCount} schools for the last ${this.daysFetched} days from TSP`,
			data: {
				tspSchoolCount: this.tspSchoolCount,
				daysFetched: this.daysFetched,
			},
		};

		return message;
	}
}
