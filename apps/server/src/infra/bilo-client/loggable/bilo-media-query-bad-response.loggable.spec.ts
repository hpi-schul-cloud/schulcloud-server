import { LogMessage } from '@core/logger';
import { ValidationError } from 'class-validator';
import { biloMediaQueryBadResponseReportFactory } from '../testing';
import { BiloMediaQueryBadResponseLoggable } from './bilo-media-query-bad-response.loggable';

describe(BiloMediaQueryBadResponseLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const reports = biloMediaQueryBadResponseReportFactory.buildList(2, {
				validationErrors: [new ValidationError()],
			});

			const loggable = new BiloMediaQueryBadResponseLoggable(reports);

			const expectedLoggableReports = [
				{ ...reports[0], validationErrors: [reports[0].validationErrors.toString()] },
				{ ...reports[1], validationErrors: [reports[1].validationErrors.toString()] },
			];

			return {
				loggable,
				expectedLoggableReports,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, expectedLoggableReports } = setup();

			const result = loggable.getLogMessage();

			expect(result).toEqual<LogMessage>({
				message: `${expectedLoggableReports.length} bad response(s) from bilo media query is/are found`,
				data: { reports: JSON.stringify(expectedLoggableReports) },
			});
		});
	});
});
