import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type ValidationError } from 'class-validator';
import { type MediaQueryBadResponseReport } from '../interface';

export class BiloMediaQueryBadResponseLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly badResponseReports: MediaQueryBadResponseReport[]) {
		super('Bad response from the media source');
	}

	public getLogMessage(): LoggableMessage {
		const loggableReports = this.badResponseReports.map((report: MediaQueryBadResponseReport) => {
			const loggableReport = {
				...report,
				validationErrors: report.validationErrors.map((validationError: ValidationError) => validationError.toString()),
			};

			return loggableReport;
		});

		return {
			type: 'BILO_MEDIA_QUERY_BAD_RESPONSE',
			stack: this.stack,
			data: {
				message: `${this.badResponseReports.length} bad response(s) from bilo media query is/are found`,
				reports: JSON.stringify(loggableReports),
			},
		};
	}
}
