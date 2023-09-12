import { RoleName } from '@shared/domain';
import { UserForGroupNotFoundLoggable } from './user-for-group-not-found.loggable';
import { ExternalGroupUserDto } from '../dto';

describe('UserForGroupNotFoundLoggable', () => {
	describe('constructor', () => {
		const setup = () => {
			const externalGroupUserDto: ExternalGroupUserDto = new ExternalGroupUserDto({
				externalUserId: 'externalUserId',
				roleName: RoleName.TEACHER,
			});

			return { externalGroupUserDto };
		};

		it('should create an instance of UserForGroupNotFoundLoggable', () => {
			const { externalGroupUserDto } = setup();

			const loggable = new UserForGroupNotFoundLoggable(externalGroupUserDto);

			expect(loggable).toBeInstanceOf(UserForGroupNotFoundLoggable);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const externalGroupUserDto: ExternalGroupUserDto = new ExternalGroupUserDto({
				externalUserId: 'externalUserId',
				roleName: RoleName.TEACHER,
			});

			const loggable = new UserForGroupNotFoundLoggable(externalGroupUserDto);

			return { loggable, externalGroupUserDto };
		};

		it('should return a loggable message', () => {
			const { loggable, externalGroupUserDto } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Unable to add unknown user to group during provisioning.',
				data: {
					externalUserId: externalGroupUserDto.externalUserId,
					roleName: externalGroupUserDto.roleName,
				},
			});
		});
	});
});
