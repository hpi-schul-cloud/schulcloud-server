import { Loggable, LogMessage } from '@core/logger';
import { RobjExportSchule } from '@infra/tsp-client';

export class TspSchulnummerMissingLoggable implements Loggable {
	constructor(private readonly tspSchools: RobjExportSchule[]) {}

	public getLogMessage(): LogMessage {
		const schoolNames = this.tspSchools.map((school) => school.schuleName || 'undefined');
		const schoolNamesString = schoolNames.join(', ');
		const message: LogMessage = {
			message: `The following TSP schools are missing a Schulnummer and are skipped.`,
			data: {
				schulNames: schoolNamesString,
			},
		};

		return message;
	}
}
