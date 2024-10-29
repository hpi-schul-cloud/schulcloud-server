import { Loggable, LogMessage } from '@src/core/logger';

export class TspTeachersFetchedLoggable implements Loggable {
	constructor(private readonly tspTeacherCount: number) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Fetched ${this.tspTeacherCount} teachers for migration from TSP`,
			data: {
				tspTeacherCount: this.tspTeacherCount,
			},
		};

		return message;
	}
}
