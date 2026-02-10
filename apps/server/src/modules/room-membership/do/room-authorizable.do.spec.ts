import { RoleName } from '@modules/role';
import { roleDtoFactory } from '@modules/role/testing';
import { RoomAuthorizable } from './room-authorizable.do';

describe('RoomAuthorizable', () => {
	const setup = () => {
		const roleStudent = roleDtoFactory.build({ name: RoleName.STUDENT });
		const roleTeacher = roleDtoFactory.build({ name: RoleName.TEACHER });

		const members = [
			{
				userId: 'user-1',
				userSchoolId: 'school-1',
				roles: [roleTeacher, roleStudent],
			},
			{
				userId: 'user-2',
				userSchoolId: 'school-2',
				roles: [roleStudent],
			},
		];

		const roomAuthorizable = new RoomAuthorizable('room-123', members, 'school-123');

		return { roomAuthorizable, roleStudent, roleTeacher };
	};

	it('should expose roomId, schoolId and id', () => {
		const { roomAuthorizable } = setup();

		expect(roomAuthorizable.roomId).toEqual('room-123');
		expect(roomAuthorizable.schoolId).toEqual('school-123');
	});

	describe('getRoleOfUser', () => {
		it('should return the first role of the user', () => {
			const { roomAuthorizable, roleTeacher } = setup();

			const role = roomAuthorizable.getRoleOfUser('user-1');

			expect(role).toEqual(roleTeacher);
		});

		it('should return null when user has no roles', () => {
			setup();
			const emptyMemberRoom = new RoomAuthorizable(
				'room-456',
				[{ userId: 'user-3', userSchoolId: 'school-3', roles: [] }],
				'school-456'
			);

			const role = emptyMemberRoom.getRoleOfUser('user-3');

			expect(role).toBeUndefined();
		});
	});

	describe('getRoleNameOfUser', () => {
		it('should return null role name when user has no roles', () => {
			const emptyMemberRoom = new RoomAuthorizable(
				'room-789',
				[{ userId: 'user-9', userSchoolId: 'school-9', roles: [] }],
				'school-789'
			);

			const roleName = emptyMemberRoom.getRoleNameOfUser('user-9');

			expect(roleName).toBeNull();
		});

		it('should return null when user is not a member', () => {
			const { roomAuthorizable } = setup();

			const role = roomAuthorizable.getRoleOfUser('unknown-user');

			expect(role).toBeNull();
		});

		it('should return role name of user', () => {
			const { roomAuthorizable } = setup();

			const roleName = roomAuthorizable.getRoleNameOfUser('user-2');

			expect(roleName).toEqual(RoleName.STUDENT);
		});

		it('should return null for role name when user not found', () => {
			const { roomAuthorizable } = setup();

			const roleName = roomAuthorizable.getRoleNameOfUser('unknown-user');

			expect(roleName).toBeNull();
		});
	});
});
