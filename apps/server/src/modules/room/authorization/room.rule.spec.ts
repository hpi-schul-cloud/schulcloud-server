import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { Action, AuthorizationContext, AuthorizationInjectionService } from '@src/modules/authorization';
import { RoomMember } from '@src/modules/room-member/do/room-member.do';
import { RoomAuthorizable } from '../domain/do/room-authorizable';
import { RoomRule } from './room.rule';

describe('RoomRule', () => {
	let module: TestingModule;
	let rule: RoomRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [RoomRule, AuthorizationInjectionService],
		}).compile();

		rule = module.get(RoomRule);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('injection', () => {
		it('should inject itself into authorisation module', () => {
			expect(injectionService.getAuthorizationRules()).toContain(rule);
		});
	});

	describe('isApplicable', () => {
		describe('when the entity is applicable', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const roomMember = new RoomMember({
					id: new ObjectId().toHexString(),
					roomId: new ObjectId(),
					userGroupId: new ObjectId(),
					createdAt: new Date(),
					updatedAt: new Date(),
					members: [],
				});

				const roomAuthorizable = new RoomAuthorizable({ id: '', roomMembers: [roomMember] });

				return {
					user,
					roomAuthorizable,
				};
			};

			it('should return true', () => {
				const { user, roomAuthorizable } = setup();

				const result = rule.isApplicable(user, roomAuthorizable);

				expect(result).toEqual(true);
			});
		});

		describe('when the entity is not applicable', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				return {
					user,
				};
			};

			it('should return false', () => {
				const { user } = setup();

				const result = rule.isApplicable(user, user);

				expect(result).toEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when the user has no permission', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const roomMember = new RoomMember({
					id: new ObjectId().toHexString(),
					roomId: new ObjectId(),
					userGroupId: new ObjectId(),
					createdAt: new Date(),
					updatedAt: new Date(),
					members: [
						{
							userId: new ObjectId(user.id),
							role: roleFactory.build({ permissions: [] }),
						},
					],
				});

				const roomAuthorizable = new RoomAuthorizable({ id: '', roomMembers: [roomMember] });

				return {
					user,
					roomAuthorizable,
				};
			};

			it('should not allow read', () => {
				const { roomAuthorizable, user } = setup();
				const context: AuthorizationContext = {
					action: Action.read,
					requiredPermissions: [],
				};
				const result = rule.hasPermission(user, roomAuthorizable, context);

				expect(result).toEqual(false);
			});

			it('should not allow write', () => {
				const { roomAuthorizable, user } = setup();
				const context: AuthorizationContext = {
					action: Action.write,
					requiredPermissions: [],
				};
				const result = rule.hasPermission(user, roomAuthorizable, context);

				expect(result).toEqual(false);
			});
		});

		describe('when user has ROOM_EDIT and ROOM_VIEW permissions', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const roomMember = new RoomMember({
					id: new ObjectId().toHexString(),
					roomId: new ObjectId(),
					userGroupId: new ObjectId(),
					createdAt: new Date(),
					updatedAt: new Date(),
					members: [
						{
							userId: new ObjectId(user.id),
							role: roleFactory.build({ permissions: [Permission.ROOM_EDIT, Permission.ROOM_VIEW] }),
						},
					],
				});

				const roomAuthorizable = new RoomAuthorizable({ id: '', roomMembers: [roomMember] });

				return {
					user,
					roomAuthorizable,
				};
			};

			it('should allow read', () => {
				const { user, roomAuthorizable } = setup();
				const context = { action: Action.read, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomAuthorizable, context);
				expect(result).toEqual(true);
			});

			it('should allow write', () => {
				const { user, roomAuthorizable } = setup();
				const context = { action: Action.write, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomAuthorizable, context);
				expect(result).toEqual(true);
			});
		});

		describe('when user has ROOM_VIEW permission', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const roomMember = new RoomMember({
					id: new ObjectId().toHexString(),
					roomId: new ObjectId(),
					userGroupId: new ObjectId(),
					createdAt: new Date(),
					updatedAt: new Date(),
					members: [
						{
							userId: new ObjectId(user.id),
							role: roleFactory.build({ permissions: [Permission.ROOM_VIEW] }),
						},
					],
				});

				const roomAuthorizable = new RoomAuthorizable({ id: '', roomMembers: [roomMember] });

				return {
					user,
					roomAuthorizable,
				};
			};
			it('should allow read', () => {
				const { user, roomAuthorizable } = setup();
				const context = { action: Action.read, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomAuthorizable, context);
				expect(result).toEqual(true);
			});

			it('should not allow write', () => {
				const { user, roomAuthorizable } = setup();
				const context = { action: Action.write, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomAuthorizable, context);
				expect(result).toEqual(false);
			});
		});

		describe('when user is not room member', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const roomMember = new RoomMember({
					id: new ObjectId().toHexString(),
					roomId: new ObjectId(),
					userGroupId: new ObjectId(),
					createdAt: new Date(),
					updatedAt: new Date(),
					members: [],
				});

				const roomAuthorizable = new RoomAuthorizable({ id: '', roomMembers: [roomMember] });

				return {
					user,
					roomAuthorizable,
				};
			};

			it('should not allow read', () => {
				const { user, roomAuthorizable } = setup();
				const context = { action: Action.read, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomAuthorizable, context);
				expect(result).toEqual(false);
			});

			it('should not allow write', () => {
				const { user, roomAuthorizable } = setup();
				const context = { action: Action.write, requiredPermissions: [] };
				const result = rule.hasPermission(user, roomAuthorizable, context);
				expect(result).toEqual(false);
			});
		});
	});
});
