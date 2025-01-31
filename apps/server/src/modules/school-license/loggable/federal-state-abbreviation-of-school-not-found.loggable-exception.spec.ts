import { FederalStateAbbreviationOfSchoolNotFoundLoggableException } from './federal-state-abbreviation-of-school-not-found.loggable-exception';

describe(FederalStateAbbreviationOfSchoolNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new FederalStateAbbreviationOfSchoolNotFoundLoggableException('testSchoolId');

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message:
					'Unable to fetch media school licenses from media source, because federal state abbreviation of school cannot be found.',
				data: {
					schoolId: 'testSchoolId',
				},
			});
		});
	});
});
