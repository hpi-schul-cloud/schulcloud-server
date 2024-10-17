import { Loggable, LogMessage } from '@src/core/logger';

export class TspDataFetchedLoggable implements Loggable {
	constructor(
		private readonly tspTeacherCount: number,
		private readonly tspStudentCount: number,
		private readonly tspClassesCount: number,
		private readonly daysFetched: number
	) {}

	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Fetched ${this.tspTeacherCount} teachers, ${this.tspStudentCount} students and ${this.tspClassesCount} classes for the last ${this.daysFetched} days from TSP`,
			data: {
				tspTeacherCount: this.tspTeacherCount,
				tspStudentCount: this.tspStudentCount,
				tspClassesCount: this.tspClassesCount,
				daysFetched: this.daysFetched,
			},
		};

		return message;
	}
}
