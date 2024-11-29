import { Loggable, LogMessage } from '../../../../core/logger';

export class TspStudentsFetchedLoggable implements Loggable {
	constructor(private readonly tspStudentCount: number) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Fetched ${this.tspStudentCount} students for migration from TSP`,
			data: {
				tspStudentCount: this.tspStudentCount,
			},
		};

		return message;
	}
}
