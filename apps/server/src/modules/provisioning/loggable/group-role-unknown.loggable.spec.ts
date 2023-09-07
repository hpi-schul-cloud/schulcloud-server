import { SanisGroupRole, SanisSonstigeGruppenzugehoerigeResponse } from '../strategy/sanis/response';
import { GroupRoleUnknownLoggable } from './group-role-unknown.loggable';

describe('GroupRoleUnknownLoggable', () => {
	describe('constructor', () => {
		const setup = () => {
			const sanisSonstigeGruppenzugehoerigeResponse: SanisSonstigeGruppenzugehoerigeResponse = {
				ktid: 'ktid',
				rollen: [SanisGroupRole.TEACHER],
			};

			return { sanisSonstigeGruppenzugehoerigeResponse };
		};

		it('should create an instance of UserForGroupNotFoundLoggable', () => {
			const { sanisSonstigeGruppenzugehoerigeResponse } = setup();

			const loggable = new GroupRoleUnknownLoggable(sanisSonstigeGruppenzugehoerigeResponse);

			expect(loggable).toBeInstanceOf(GroupRoleUnknownLoggable);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const sanisSonstigeGruppenzugehoerigeResponse: SanisSonstigeGruppenzugehoerigeResponse = {
				ktid: 'ktid',
				rollen: [SanisGroupRole.TEACHER],
			};

			const loggable = new GroupRoleUnknownLoggable(sanisSonstigeGruppenzugehoerigeResponse);

			return { loggable, sanisSonstigeGruppenzugehoerigeResponse };
		};

		it('should return a loggable message', () => {
			const { loggable, sanisSonstigeGruppenzugehoerigeResponse } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Unable to add unknown user to group during provisioning.',
				data: {
					externalUserId: sanisSonstigeGruppenzugehoerigeResponse.ktid,
					externalRoleName: sanisSonstigeGruppenzugehoerigeResponse.rollen[0],
				},
			});
		});
	});
});
