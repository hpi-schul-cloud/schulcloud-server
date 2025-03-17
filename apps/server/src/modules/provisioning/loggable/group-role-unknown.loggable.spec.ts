import { SchulconnexGroupRole, SchulconnexSonstigeGruppenzugehoerigeResponse } from '@infra/schulconnex-client';
import { GroupRoleUnknownLoggable } from './group-role-unknown.loggable';

describe('GroupRoleUnknownLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const sonstigeGruppenzugehoerigeResponse: SchulconnexSonstigeGruppenzugehoerigeResponse = {
				ktid: 'ktid',
				rollen: [SchulconnexGroupRole.TEACHER],
			};

			const loggable = new GroupRoleUnknownLoggable(sonstigeGruppenzugehoerigeResponse);

			return { loggable, sonstigeGruppenzugehoerigeResponse };
		};

		it('should return a loggable message', () => {
			const { loggable, sonstigeGruppenzugehoerigeResponse } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Unable to add unknown user to group during provisioning.',
				data: {
					externalUserId: sonstigeGruppenzugehoerigeResponse.ktid,
					externalRoleName: sonstigeGruppenzugehoerigeResponse.rollen?.[0],
				},
			});
		});
	});
});
