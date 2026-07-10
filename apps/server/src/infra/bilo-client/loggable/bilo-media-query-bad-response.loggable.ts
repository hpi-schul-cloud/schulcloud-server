import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type ValidationError } from 'class-validator';
import { type MediaQueryBadResponseReport } from '../interface';

export class BiloMediaQueryBadResponseLoggable implements Loggable {
	constructor(private readonly badResponseReports: MediaQueryBadResponseReport[]) {}

	public getLogMessage(): LoggableMessage {
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
