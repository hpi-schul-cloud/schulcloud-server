import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class SchoolInUserMigrationEndLoggable implements Loggable {
	constructor(private readonly schoolName: string) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Migration for school is completed',
			data: {
				schoolName: this.schoolName,
			},
		};
	}
}
