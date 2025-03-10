import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { InternalServerErrorException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { MediaQueryBadResponseReport } from '../interface';

export class BiloMediaQueryBadResponseLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly badResponseReports: MediaQueryBadResponseReport[]) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const loggableReports = this.badResponseReports.map((report: MediaQueryBadResponseReport) => {
			const loggableReport = {
				...report,
				validationErrors: report.validationErrors.map((validationError: ValidationError) => validationError.toString()),
			};

			return loggableReport;
		});

		return {
			type: 'BILO_MEDIA_QUERY_BAD_RESPONSE',
			message: `${this.badResponseReports.length} response(s) is/are found with bad response from bilo media query`,
			stack: this.stack,
			data: { reports: JSON.stringify(loggableReports) },
		};
	}
}
