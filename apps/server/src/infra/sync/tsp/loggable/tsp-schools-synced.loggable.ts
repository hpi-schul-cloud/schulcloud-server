import { Loggable, LogMessage } from '@src/core/logger';

export class TspSchoolsSyncedLoggable implements Loggable {
	constructor(
		private readonly tspSchoolCount: number,
		private readonly createdSchools: number,
		private readonly updatedSchools: number
	) {}

	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Synced schools: Of ${this.tspSchoolCount} schools, ${this.createdSchools} were created and ${this.updatedSchools} were updated`,
			data: {
				tspSchoolCount: this.tspSchoolCount,
				createdSchools: this.createdSchools,
				updatedSchools: this.updatedSchools,
			},
		};

		return message;
	}
}
