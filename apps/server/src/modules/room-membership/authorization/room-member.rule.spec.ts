import { EntityManager } from '@mikro-orm/core';
import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { Role } from '@modules/role/repo';
import { roomEntityFactory } from '@modules/room/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { TestApiClient } from '@testing/test-api-client';
import { RoomSetup } from '../../room/api/test/util/room-setup.helper';
import { RoomAuthorizable } from '../do/room-authorizable.do';
import { buildRoomMemberAuthorizable } from '../testing';
import { RoomMemberRule } from './room-member.rule';
import { RoomRule } from './room.rule';

describe(RoomMemberRule.name, () => {
	let service: RoomMemberRule;
	// let roomRule: RoomRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RoomMemberRule,
				RoomRule,
				AuthorizationHelper,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		module.get(RoomRule);
		injectionService = await module.get(AuthorizationInjectionService);
		service = await module.get(RoomMemberRule);
	});

	describe('injection', () => {
		it('should inject itself into authorisation module', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	describe('isApplicable', () => {
		describe('when entity is applicable', () => {
			const setup = () => {
				const room = roomEntityFactory.buildWithId();
				const user = userFactory.buildWithId();
				const members = [{ userId: user.id, roles: [], userSchoolId: user.school.id }];
				const roomAuthorizable = new RoomAuthorizable(room.id, members, user.school.id);
				const roomMemberAuthorizable = buildRoomMemberAuthorizable(roomAuthorizable, user);

				return { user, roomMemberAuthorizable };
			};

			it('should return true', () => {
				const { user, roomMemberAuthorizable } = setup();
				const result = service.isApplicable(user, roomMemberAuthorizable);

				expect(result).toStrictEqual(true);
			});
		});

		describe('when entity is not applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				return { user };
			};

			it('should return false', () => {
				const { user } = setup();

				const result = service.isApplicable(user, user);

				expect(result).toStrictEqual(false);
			});
		});
	});

	const mockEntityManager = (): EntityManager => {
		const em = {
			persist: jest.fn().mockReturnThis(),
			flush: jest.fn(),
			clear: jest.fn(),
		};
		return em as unknown as EntityManager;
	};

	const mockTestApiClient = (): TestApiClient => {
		const client = {
			login: jest.fn(() => Promise.resolve(client)),
		};
		return client as unknown as TestApiClient;
	};

	const setup = async (alias: string, targetUserAlias: string) => {
		const roomSetup = new RoomSetup(mockEntityManager(), mockTestApiClient());
		await roomSetup.setup([
			// sameSchool + administrator
			['sameSchool_administrator_roomowner', 'sameSchool', 'administrator', 'roomowner'],
			['sameSchool_administrator_roomadmin', 'sameSchool', 'administrator', 'roomadmin'],
			['sameSchool_administrator_roomeditor', 'sameSchool', 'administrator', 'roomeditor'],
			['sameSchool_administrator_roomviewer', 'sameSchool', 'administrator', 'roomviewer'],
			['sameSchool_administrator_none', 'sameSchool', 'administrator', 'none'],
			// sameSchool + teacher
			['sameSchool_teacher_roomowner', 'sameSchool', 'teacher', 'roomowner'],
			['sameSchool_teacher_roomadmin', 'sameSchool', 'teacher', 'roomadmin'],
			['sameSchool_teacher_roomeditor', 'sameSchool', 'teacher', 'roomeditor'],
			['sameSchool_teacher_roomviewer', 'sameSchool', 'teacher', 'roomviewer'],
			['sameSchool_teacher_none', 'sameSchool', 'teacher', 'none'],
			// sameSchool + student
			['sameSchool_student_roomowner', 'sameSchool', 'student', 'roomowner'],
			['sameSchool_student_roomadmin', 'sameSchool', 'student', 'roomadmin'],
			['sameSchool_student_roomeditor', 'sameSchool', 'student', 'roomeditor'],
			['sameSchool_student_roomviewer', 'sameSchool', 'student', 'roomviewer'],
			['sameSchool_student_none', 'sameSchool', 'student', 'none'],
			// sameSchool + externalPerson
			['sameSchool_externalPerson_roomowner', 'sameSchool', 'externalPerson', 'roomowner'],
			['sameSchool_externalPerson_roomadmin', 'sameSchool', 'externalPerson', 'roomadmin'],
			['sameSchool_externalPerson_roomeditor', 'sameSchool', 'externalPerson', 'roomeditor'],
			['sameSchool_externalPerson_roomviewer', 'sameSchool', 'externalPerson', 'roomviewer'],
			['sameSchool_externalPerson_none', 'sameSchool', 'externalPerson', 'none'],
			// sameSchool + teacherAndAdmin
			['sameSchool_teacherAndAdmin_roomowner', 'sameSchool', ['teacher', 'administrator'], 'roomowner'],
			['sameSchool_teacherAndAdmin_roomadmin', 'sameSchool', ['teacher', 'administrator'], 'roomadmin'],
			['sameSchool_teacherAndAdmin_roomeditor', 'sameSchool', ['teacher', 'administrator'], 'roomeditor'],
			['sameSchool_teacherAndAdmin_roomviewer', 'sameSchool', ['teacher', 'administrator'], 'roomviewer'],
			['sameSchool_teacherAndAdmin_none', 'sameSchool', ['teacher', 'administrator'], 'none'],

			// otherSchool + administrator
			['otherSchool_administrator_roomowner', 'otherSchool', 'administrator', 'roomowner'],
			['otherSchool_administrator_roomadmin', 'otherSchool', 'administrator', 'roomadmin'],
			['otherSchool_administrator_roomeditor', 'otherSchool', 'administrator', 'roomeditor'],
			['otherSchool_administrator_roomviewer', 'otherSchool', 'administrator', 'roomviewer'],
			['otherSchool_administrator_none', 'otherSchool', 'administrator', 'none'],
			// otherSchool + teacher
			['otherSchool_teacher_roomowner', 'otherSchool', 'teacher', 'roomowner'],
			['otherSchool_teacher_roomadmin', 'otherSchool', 'teacher', 'roomadmin'],
			['otherSchool_teacher_roomeditor', 'otherSchool', 'teacher', 'roomeditor'],
			['otherSchool_teacher_roomviewer', 'otherSchool', 'teacher', 'roomviewer'],
			['otherSchool_teacher_none', 'otherSchool', 'teacher', 'none'],
			// otherSchool + student
			['otherSchool_student_roomowner', 'otherSchool', 'student', 'roomowner'],
			['otherSchool_student_roomadmin', 'otherSchool', 'student', 'roomadmin'],
			['otherSchool_student_roomeditor', 'otherSchool', 'student', 'roomeditor'],
			['otherSchool_student_roomviewer', 'otherSchool', 'student', 'roomviewer'],
			['otherSchool_student_none', 'otherSchool', 'student', 'none'],
			// otherSchool + externalPerson
			['otherSchool_externalPerson_roomowner', 'otherSchool', 'externalPerson', 'roomowner'],
			['otherSchool_externalPerson_roomadmin', 'otherSchool', 'externalPerson', 'roomadmin'],
			['otherSchool_externalPerson_roomeditor', 'otherSchool', 'externalPerson', 'roomeditor'],
			['otherSchool_externalPerson_roomviewer', 'otherSchool', 'externalPerson', 'roomviewer'],
			['otherSchool_externalPerson_none', 'otherSchool', 'externalPerson', 'none'],
			// otherSchool + teacherAndAdmin
			['otherSchool_teacherAndAdmin_roomowner', 'otherSchool', ['teacher', 'administrator'], 'roomowner'],
			['otherSchool_teacherAndAdmin_roomadmin', 'otherSchool', ['teacher', 'administrator'], 'roomadmin'],
			['otherSchool_teacherAndAdmin_roomeditor', 'otherSchool', ['teacher', 'administrator'], 'roomeditor'],
			['otherSchool_teacherAndAdmin_roomviewer', 'otherSchool', ['teacher', 'administrator'], 'roomviewer'],
			['otherSchool_teacherAndAdmin_none', 'otherSchool', ['teacher', 'administrator'], 'none'],
		]);
		const user = roomSetup.getUserByName(alias);
		const targetUser = roomSetup.getUserByName(targetUserAlias);
		const { room, userGroupEntity } = roomSetup;

		const members: { userId: string; roles: Role[]; userSchoolId: string }[] = userGroupEntity.users.map(
			({ user, role }) => {
				return {
					userId: user.id,
					roles: [role],
					userSchoolId: user.school.id,
				};
			}
		);
		const roomAuthorizable = new RoomAuthorizable(room.id, members, roomSetup.sameSchool.id);
		const roomMemberAuthorizable = buildRoomMemberAuthorizable(roomAuthorizable, targetUser);

		// return roomSetup;
		return { user, roomMemberAuthorizable };
	};

	describe('hasPermission', () => {
		it.each([
			['sameSchool_teacher_roomadmin', Permission.ROOM_ADD_MEMBERS, true],
			['sameSchool_teacher_none', Permission.ROOM_ADD_MEMBERS, false],
			['sameSchool_administrator_none', Permission.ROOM_ADD_MEMBERS, false],
			['otherSchool_teacher_none', Permission.ROOM_ADD_MEMBERS, false],
			['otherSchool_administrator_none', Permission.ROOM_ADD_MEMBERS, false],
		])('%s has permission %s  =  (%s)', async (alias, permission, expected) => {
			const { user, roomMemberAuthorizable } = await setup(alias, 'sameSchool_student_roomviewer');
			const context: AuthorizationContext = new AuthorizationContext({
				requiredPermissions: [permission],
				action: Action.write,
			});

			const result = service.hasPermission(user, roomMemberAuthorizable, context);

			expect(result).toBe(expected);
		});
	});

	describe('canPassOwnershipTo', () => {
		describe('when user is teacher', () => {
			describe('same user cannot pass ownership to himself', () => {
				it.each([
					['sameSchool_teacher_roomowner', 'sameSchool_teacher_roomowner', false],
					['sameSchool_teacher_roomadmin', 'sameSchool_teacher_roomadmin', false],
					['otherSchool_teacher_roomadmin', 'sameSchool_teacher_roomadmin', false],
					['otherSchool_teacher_none', 'sameSchool_teacher_none', false],
				])('%s => %s  =  (%s)', async (alias, targetUserAlias, expected) => {
					const { user, roomMemberAuthorizable } = await setup(alias, targetUserAlias);

					const result = service.canPassOwnershipTo(user, roomMemberAuthorizable);

					expect(result).toBe(expected);
				});
			});

			describe('room owner can pass ownership to non-owners in same school', () => {
				it.each([
					['sameSchool_teacher_roomowner', 'sameSchool_teacher_roomadmin', true],
					['sameSchool_teacher_roomowner', 'sameSchool_teacher_roomeditor', true],
					['sameSchool_teacher_roomowner', 'sameSchool_teacher_roomviewer', true],
					['otherSchool_teacher_roomowner', 'sameSchool_teacher_roomviewer', true],
					['otherSchool_teacher_roomowner', 'otherSchool_teacher_roomviewer', true],
				])('%s => %s  =  (%s)', async (alias, targetUserAlias, expected) => {
					const { user, roomMemberAuthorizable } = await setup(alias, targetUserAlias);

					const result = service.canPassOwnershipTo(user, roomMemberAuthorizable);

					expect(result).toBe(expected);
				});
			});

			describe('non-owners cannot pass ownership to others in same school', () => {
				it.each([
					['sameSchool_teacher_roomadmin', 'sameSchool_teacher_roomeditor', false],
					['sameSchool_teacher_roomadmin', 'sameSchool_teacher_roomviewer', false],
					['sameSchool_teacher_roomeditor', 'sameSchool_teacher_roomadmin', false],
					['sameSchool_teacher_roomviewer', 'sameSchool_teacher_roomadmin', false],
					['sameSchool_teacher_none', 'sameSchool_teacher_roomadmin', false],
				])('%s => %s  =  (%s)', async (alias, targetUserAlias, expected) => {
					const { user, roomMemberAuthorizable } = await setup(alias, targetUserAlias);

					const result = service.canPassOwnershipTo(user, roomMemberAuthorizable);

					expect(result).toBe(expected);
				});
			});

			describe('when target user is not teacher', () => {
				it.each([
					['sameSchool_teacher_roomadmin', 'sameSchool_student_roomeditor', false],
					['sameSchool_teacher_roomadmin', 'sameSchool_student_roomviewer', false],
					['sameSchool_teacher_roomeditor', 'sameSchool_student_roomadmin', false],
					['sameSchool_teacher_roomviewer', 'sameSchool_student_roomadmin', false],
					['sameSchool_teacher_none', 'sameSchool_student_roomadmin', false],
					['sameSchool_teacher_none', 'sameSchool_administrator_roomadmin', false],
					['sameSchool_teacher_roomeditor', 'sameSchool_administrator_roomadmin', false],
				])('%s => %s  =  (%s)', async (alias, targetUserAlias, expected) => {
					const { user, roomMemberAuthorizable } = await setup(alias, targetUserAlias);

					const result = service.canPassOwnershipTo(user, roomMemberAuthorizable);

					expect(result).toBe(expected);
				});
			});

			describe('when user is from another school', () => {
				it.each([
					['otherSchool_teacher_roomadmin', 'sameSchool_teacher_roomeditor', false],
					['otherSchool_teacher_roomadmin', 'sameSchool_student_roomeditor', false],
					['otherSchool_teacher_roomeditor', 'sameSchool_teacher_roomadmin', false],
					['otherSchool_teacher_roomviewer', 'sameSchool_teacher_roomadmin', false],
					['otherSchool_teacher_none', 'sameSchool_teacher_roomadmin', false],
				])('%s => %s  =  (%s)', async (alias, targetUserAlias, expected) => {
					const { user, roomMemberAuthorizable } = await setup(alias, targetUserAlias);

					const result = service.canPassOwnershipTo(user, roomMemberAuthorizable);

					expect(result).toBe(expected);
				});
			});
		});

		describe('when user is administrator', () => {
			describe('same user can pass ownership to himself', () => {
				it.each([
					['sameSchool_administrator_roomadmin', 'sameSchool_administrator_roomadmin', true],
					['sameSchool_administrator_roomviewer', 'sameSchool_administrator_roomviewer', true],
					['sameSchool_administrator_roomeditor', 'sameSchool_administrator_roomeditor', true],
				])('%s => %s  =  (%s)', async (alias, targetUserAlias, expected) => {
					const { user, roomMemberAuthorizable } = await setup(alias, targetUserAlias);

					const result = service.canPassOwnershipTo(user, roomMemberAuthorizable);

					expect(result).toBe(expected);
				});
			});

			describe('can pass ownership to non-owners of same school', () => {
				it.each([
					['sameSchool_administrator_none', 'sameSchool_teacher_roomowner', false],
					['sameSchool_administrator_none', 'sameSchool_teacher_roomadmin', true],
					['sameSchool_administrator_none', 'sameSchool_teacher_roomeditor', true],
					['sameSchool_administrator_none', 'sameSchool_teacher_roomviewer', true],
				])('%s => %s  =  (%s)', async (alias, targetUserAlias, expected) => {
					const { user, roomMemberAuthorizable } = await setup(alias, targetUserAlias);

					const result = service.canPassOwnershipTo(user, roomMemberAuthorizable);

					expect(result).toBe(expected);
				});
			});

			describe('non-owners cannot pass ownership to others in same school', () => {
				it.each([
					['sameSchool_administrator_roomadmin', 'sameSchool_teacher_roomeditor', true],
					['sameSchool_administrator_roomadmin', 'sameSchool_teacher_roomviewer', true],
					['sameSchool_administrator_roomeditor', 'sameSchool_teacher_roomadmin', true],
					['sameSchool_administrator_roomviewer', 'sameSchool_teacher_roomadmin', true],
					['sameSchool_administrator_none', 'sameSchool_teacher_roomadmin', true],
				])('%s => %s  =  (%s)', async (alias, targetUserAlias, expected) => {
					const { user, roomMemberAuthorizable } = await setup(alias, targetUserAlias);

					const result = service.canPassOwnershipTo(user, roomMemberAuthorizable);

					expect(result).toBe(expected);
				});
			});
		});
	});
});
