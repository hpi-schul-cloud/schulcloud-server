import { SanisGroupRole, SanisGruppenzugehoerigkeitResponse } from '../strategy/sanis/response';
import { GroupRoleUnknownLoggable } from './group-role-unknown.loggable';

describe('GroupRoleUnknownLoggable', () => {
	describe('constructor', () => {
		const setup = () => {
			const sanisGruppenzugehoerigkeitResponse: SanisGruppenzugehoerigkeitResponse = {
				id: 'id',
				von: new Date(2023, 1, 1),
				bis: new Date(2023, 12, 31),
				ktid: 'ktid',
				rollen: [SanisGroupRole.TEACHER],
			};

			return { sanisGruppenzugehoerigkeitResponse };
		};

		it('should create an instance of UserForGroupNotFoundLoggable', () => {
			const { sanisGruppenzugehoerigkeitResponse } = setup();

			const loggable = new GroupRoleUnknownLoggable(sanisGruppenzugehoerigkeitResponse);

			expect(loggable).toBeInstanceOf(GroupRoleUnknownLoggable);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const sanisGruppenzugehoerigkeitResponse: SanisGruppenzugehoerigkeitResponse = {
				id: 'id',
				von: new Date(2023, 1, 1),
				bis: new Date(2023, 12, 31),
				ktid: 'ktid',
				rollen: [SanisGroupRole.TEACHER],
			};

			const loggable = new GroupRoleUnknownLoggable(sanisGruppenzugehoerigkeitResponse);

			return { loggable, sanisGruppenzugehoerigkeitResponse };
		};

		it('should return a loggable message', () => {
			const { loggable, sanisGruppenzugehoerigkeitResponse } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Unable to add unknown user to group during provisioning.',
				data: {
					externalUserId: sanisGruppenzugehoerigkeitResponse.ktid,
					externalRoleName: sanisGruppenzugehoerigkeitResponse.rollen[0],
				},
			});
		});
	});
});
