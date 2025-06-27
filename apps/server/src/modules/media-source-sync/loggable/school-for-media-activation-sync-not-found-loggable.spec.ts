import { SchoolForMediaActivationSyncNotFoundLoggable } from './school-for-media-activation-sync-not-found-loggable';

describe(SchoolForMediaActivationSyncNotFoundLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const officialSchoolNumber = '00100';
			const exception = new SchoolForMediaActivationSyncNotFoundLoggable(officialSchoolNumber);

			return { exception, officialSchoolNumber };
		};

		it('should return the correct log message', () => {
			const { exception, officialSchoolNumber } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: 'Unable to sync media activations because school could not be found.',
				data: {
					officialSchoolNumber,
				},
			});
		});
	});
});
