import { ObjectId } from '@mikro-orm/mongodb';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { mediaUserLicenseFactory } from '@modules/user-license/testing';
import { SchoolExternalToolCreatedLoggable } from './school-external-tool-created.loggable';

describe('SchoolExternalToolCreatedLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const license = mediaUserLicenseFactory.build();
			const schoolExternalTool = schoolExternalToolFactory.build();

			const loggable = new SchoolExternalToolCreatedLoggable(userId, license, schoolExternalTool);

			return {
				loggable,
				license,
				schoolExternalTool,
				userId,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, license, schoolExternalTool, userId } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'A school external tool was automatically created for a licensed medium',
				data: {
					userId,
					schoolId: schoolExternalTool.schoolId,
					mediumId: license.mediumId,
					mediaSourceId: license.mediaSource?.sourceId,
					schoolExternalToolId: schoolExternalTool.id,
				},
			});
		});
	});
});
