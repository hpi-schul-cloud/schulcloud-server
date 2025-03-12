import { ErrorLogMessage } from '@core/logger';
import { ValidationError } from 'class-validator';
import { biloMediaQueryBadResponseReportFactory } from '../testing';
import { BiloMediaQueryBadResponseLoggableException } from './bilo-media-query-bad-response.loggable-exception';

describe(BiloMediaQueryBadResponseLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const reports = biloMediaQueryBadResponseReportFactory.buildList(2, {
				validationErrors: [new ValidationError()],
			});

			const exception = new BiloMediaQueryBadResponseLoggableException(reports);

			const expectedLoggableReports = [
				{ ...reports[0], validationErrors: [reports[0].validationErrors.toString()] },
				{ ...reports[1], validationErrors: [reports[1].validationErrors.toString()] },
			];

			return {
				exception,
				expectedLoggableReports,
			};
		};

		it('should return the correct log message', () => {
			const { exception, expectedLoggableReports } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual<ErrorLogMessage>({
				type: 'BILO_MEDIA_QUERY_BAD_RESPONSE',
				stack: exception.stack,
				data: {
					message: `${expectedLoggableReports.length} bad response(s) from bilo media query is/are found`,
					reports: JSON.stringify(expectedLoggableReports),
				},
			});
		});
	});
});
