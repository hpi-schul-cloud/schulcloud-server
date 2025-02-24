import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { ValidationError } from 'class-validator';
import { MediaQueryBadResponseReport } from '../interface';

export class BiloMediaQueryBadResponseLoggable implements Loggable {
	constructor(private readonly badResponseReports: MediaQueryBadResponseReport[]) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const loggableReports = this.badResponseReports.map((report: MediaQueryBadResponseReport) => {
			const loggableReport = {
				...report,
				validationErrors: report.validationErrors.map((validationError: ValidationError) => validationError.toString()),
			};

			return loggableReport;
		});

		return {
			message: `${this.badResponseReports.length} response(s) is/are found with bad response from bilo media query`,
			data: { reports: JSON.stringify(loggableReports) },
		};
	}
}
