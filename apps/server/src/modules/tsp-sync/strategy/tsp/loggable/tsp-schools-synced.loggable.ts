import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class TspSchoolsSyncedLoggable implements Loggable {
	constructor(
		private readonly tspSchoolCount: number,
		private readonly processedSchools: number,
		private readonly createdSchools: number,
		private readonly updatedSchools: number
	) {}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
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
