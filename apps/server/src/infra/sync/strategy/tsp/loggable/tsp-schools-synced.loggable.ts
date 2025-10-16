import { Loggable, LogMessage } from '@core/logger';

export class TspSchoolsSyncedLoggable implements Loggable {
	constructor(
		private readonly tspSchoolCount: number,
		private readonly processedSchools: number,
		private readonly createdSchools: number,
		private readonly updatedSchools: number
	) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Synced schools: Of ${this.tspSchoolCount} schools ${this.processedSchools} were processed. ${this.createdSchools} were created and ${this.updatedSchools} were updated`,
			data: {
				tspSchoolCount: this.tspSchoolCount,
				processedSchools: this.processedSchools,
				createdSchools: this.createdSchools,
				updatedSchools: this.updatedSchools,
			},
		};

		return message;
	}
}
