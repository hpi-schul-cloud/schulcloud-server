import { SchoolForSchoolMediaLicenseSyncNotFoundLoggable } from './school-for-school-media-license-sync-not-found.loggable';

describe(SchoolForSchoolMediaLicenseSyncNotFoundLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const officialSchoolNumber = '00100';
			const exception = new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(officialSchoolNumber);

			return { exception, officialSchoolNumber };
		};

		it('should return the correct log message', () => {
			const { exception, officialSchoolNumber } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: 'Unable to sync media school license, because school cannot be found.',
				data: {
					officialSchoolNumber,
				},
			});
		});
	});
});
