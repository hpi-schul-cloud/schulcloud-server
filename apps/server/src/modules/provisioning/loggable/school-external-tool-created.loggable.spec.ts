import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { mediaUserLicenseFactory } from '@modules/user-license';
import { SchoolExternalToolCreatedLoggable } from './school-external-tool-created.loggable';

describe('SchoolExternalToolCreatedLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const license = mediaUserLicenseFactory.build();
			const schoolExternalTool = schoolExternalToolFactory.build();

			const loggable = new SchoolExternalToolCreatedLoggable(license, schoolExternalTool);

			return {
				loggable,
				license,
				schoolExternalTool,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, license, schoolExternalTool } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'A school external tool was automatically created for a licensed medium',
				data: {
					userId: license.userId,
					schoolId: schoolExternalTool.schoolId,
					mediumId: license.mediumId,
					mediaSourceId: license.mediaSourceId,
					schoolExternalToolId: schoolExternalTool.id,
				},
			});
		});
	});
});
