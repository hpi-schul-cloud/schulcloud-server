import { BuildMediaSchoolLicenseFailedLoggable } from './build-media-school-license-failed.loggable';

describe(BuildMediaSchoolLicenseFailedLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const loggable = new BuildMediaSchoolLicenseFailedLoggable();

			return {
				loggable,
			};
		};

		it('should return the correct log message', () => {
			const { loggable } = setup();

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message: 'Unable to build media school license, because mediumId is missing.',
			});
		});
	});
});
