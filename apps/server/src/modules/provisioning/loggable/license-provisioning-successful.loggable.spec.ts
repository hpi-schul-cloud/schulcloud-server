import { ObjectId } from '@mikro-orm/mongodb';
import { LicenseProvisioningSuccessfulLoggable } from './license-provisioning-successful.loggable';

describe(LicenseProvisioningSuccessfulLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const licenseCount = 3;

			const loggable = new LicenseProvisioningSuccessfulLoggable(userId, licenseCount);

			return {
				loggable,
				userId,
				licenseCount,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, userId, licenseCount } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'License provisioning successful',
				data: {
					userId,
					licenseCount,
				},
			});
		});
	});
});
