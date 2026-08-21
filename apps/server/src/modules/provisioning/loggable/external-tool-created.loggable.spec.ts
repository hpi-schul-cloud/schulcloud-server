import { ObjectId } from '@mikro-orm/mongodb';
import { mediaUserLicenseFactory } from '@modules/user-license/testing';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { ExternalToolCreatedLoggable } from './external-tool-created.loggable';

describe(ExternalToolCreatedLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const license = mediaUserLicenseFactory.build();
			const externalTool = externalToolFactory.build();

			const loggable = new ExternalToolCreatedLoggable(userId, schoolId, license, externalTool);

			return {
				loggable,
				userId,
				schoolId,
				license,
				externalTool,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, userId, schoolId, license, externalTool } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'An external tool was automatically created for a licensed medium',
				data: {
					userId,
					schoolId,
					mediumId: license.mediumId,
					mediaSourceId: license.mediaSource?.sourceId,
					ExternalToolId: externalTool.id,
				},
			});
		});
	});
});
