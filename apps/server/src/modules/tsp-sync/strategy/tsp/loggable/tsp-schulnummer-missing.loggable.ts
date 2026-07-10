import { type RobjExportSchule } from '@infra/tsp-client';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class TspSchulnummerMissingLoggable implements Loggable {
	constructor(private readonly tspSchools: RobjExportSchule[]) {}

	public getLogMessage(): LoggableMessage {
		const schoolNames = this.tspSchools.map((school) => school.schuleName || 'undefined');
		const schoolNamesString = schoolNames.join(', ');
		const message: LoggableMessage = {
			message: `The following TSP schools are missing a Schulnummer and are skipped.`,
			data: {
				schulNames: schoolNamesString,
			},
		};

		return message;
	}
}
