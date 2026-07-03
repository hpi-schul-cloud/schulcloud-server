import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class SchoolForMediaActivationSyncNotFoundLoggable implements Loggable {
	constructor(private readonly officialSchoolNumber: string) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Unable to sync media activations because school could not be found.',
			data: {
				officialSchoolNumber: this.officialSchoolNumber,
			},
		};
	}
}
