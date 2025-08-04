import { LogMessage } from '@core/logger';
import { SchoolForMediaActivationSyncNotFoundLoggable } from './school-for-media-activation-sync-not-found-loggable';

describe(SchoolForMediaActivationSyncNotFoundLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const officialSchoolNumber = '00100';
			const loggable = new SchoolForMediaActivationSyncNotFoundLoggable(officialSchoolNumber);

			return { loggable, officialSchoolNumber };
		};

		it('should return the correct log message', () => {
			const { loggable, officialSchoolNumber } = setup();

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual<LogMessage>({
				message: 'Unable to sync media activations because school could not be found.',
				data: {
					officialSchoolNumber,
				},
			});
		});
	});
});
