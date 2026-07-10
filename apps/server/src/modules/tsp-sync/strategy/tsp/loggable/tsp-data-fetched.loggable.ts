import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class TspDataFetchedLoggable implements Loggable {
	constructor(
		private readonly tspTeacherCount: number,
		private readonly tspStudentCount: number,
		private readonly tspClassesCount: number,
		private readonly daysFetched: number
	) {}

	public getLogMessage(): LoggableMessage {
		let message: string;
		if (this.daysFetched === -1) {
			message = `Fetched ${this.tspTeacherCount} teachers, ${this.tspStudentCount} students and ${this.tspClassesCount} classes for full sync from TSP.`;
		} else {
			message = `Fetched ${this.tspTeacherCount} teachers, ${this.tspStudentCount} students and ${this.tspClassesCount} classes for the last ${this.daysFetched} days from TSP`;
		}

		const logMessage: LoggableMessage = {
			message,
			data: {
				tspTeacherCount: this.tspTeacherCount,
				tspStudentCount: this.tspStudentCount,
				tspClassesCount: this.tspClassesCount,
				daysFetched: this.daysFetched,
			},
		};

		return logMessage;
	}
}
