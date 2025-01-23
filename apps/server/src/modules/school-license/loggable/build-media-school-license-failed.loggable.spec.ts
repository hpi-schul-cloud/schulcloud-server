import { BuildMediaSchoolLicenseFailedLoggable } from './build-media-school-license-failed.loggable';

describe(BuildMediaSchoolLicenseFailedLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new BuildMediaSchoolLicenseFailedLoggable();

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: 'Unable to build media school license, because mediumId is missing.',
			});
		});
	});
});
