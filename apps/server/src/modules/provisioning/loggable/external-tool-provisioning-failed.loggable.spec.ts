import { ObjectId } from '@mikro-orm/mongodb';
import { mediaUserLicenseFactory } from '@modules/user-license/testing';
import { NotFoundException } from '@nestjs/common';
import { type LogMessage } from '@shared/common/loggable';
import { ExternalToolProvisioningFailedLoggable } from './external-tool-provisioning-failed.loggable';

describe(ExternalToolProvisioningFailedLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when the error can be identified', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const schoolId = new ObjectId().toHexString();
				const license = mediaUserLicenseFactory.build();
				const error = new NotFoundException('test error');

				const loggable = new ExternalToolProvisioningFailedLoggable(userId, schoolId, license, error);

				return {
					loggable,
					userId,
					schoolId,
					license,
					error,
				};
			};

			it('should return the correct log message', () => {
				const { loggable, userId, schoolId, license, error } = setup();

				const result = loggable.getLogMessage();

				expect(result).toEqual<LogMessage>({
					message: 'Provisioning external tool for licensed medium failed.',
					data: {
						userId,
						schoolId,
						mediumId: license.mediumId,
						mediaSourceId: license.mediaSource?.sourceId,
						error: {
							name: error.name,
							message: error.message,
						},
					},
				});
			});
		});

		describe('when the error cannot be identified', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const schoolId = new ObjectId().toHexString();
				const license = mediaUserLicenseFactory.build();
				const error = 'not an error';

				const loggable = new ExternalToolProvisioningFailedLoggable(userId, schoolId, license, error);

				return {
					loggable,
					userId,
					schoolId,
					license,
				};
			};

			it('should return the correct log message', () => {
				const { loggable, userId, schoolId, license } = setup();

				const result = loggable.getLogMessage();

				expect(result).toEqual<LogMessage>({
					message: 'Provisioning external tool for licensed medium failed.',
					data: {
						userId,
						schoolId,
						mediumId: license.mediumId,
						mediaSourceId: license.mediaSource?.sourceId,
						error: 'Unknown error',
					},
				});
			});
		});
	});
});
