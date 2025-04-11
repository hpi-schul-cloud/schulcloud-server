import { Loggable, LogMessage } from '@core/logger';
import { ValidationError } from 'class-validator';
import { MediaQueryBadResponseReport } from '../interface';

export class BiloMediaQueryBadResponseLoggable implements Loggable {
	constructor(private readonly badResponseReports: MediaQueryBadResponseReport[]) {}

	public getLogMessage(): LogMessage {
		const loggableReports = this.badResponseReports.map((report: MediaQueryBadResponseReport) => {
			const loggableReport = {
				...report,
				validationErrors: report.validationErrors.map((validationError: ValidationError) => validationError.toString()),
			};

			return loggableReport;
		});

		return {
			message: `${this.badResponseReports.length} bad response(s) from bilo media query is/are found`,
			data: { reports: JSON.stringify(loggableReports) },
		};
	}
}
