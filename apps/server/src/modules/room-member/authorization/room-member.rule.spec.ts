import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { roleDtoFactory, setupEntities, userFactory } from '@shared/testing';
import { Action, AuthorizationHelper, AuthorizationInjectionService } from '@src/modules/authorization';
import { RoomMemberAuthorizable } from '../do/room-member-authorizable.do';
import { RoomMemberRule } from './room-member.rule';

describe(RoomMemberRule.name, () => {
	let service: RoomMemberRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [RoomMemberRule, AuthorizationHelper, AuthorizationInjectionService],
		}).compile();

		service = await module.get(RoomMemberRule);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	describe('injection', () => {
		it('should inject itself into authorisation module', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	describe('isApplicable', () => {
		describe('when entity is applicable', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomMemberAuthorizable = new RoomMemberAuthorizable('', []);

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

	describe('hasPermission', () => {
		describe('when user is viewer member of room', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roleDto = roleDtoFactory.build({ permissions: [Permission.ROOM_VIEW] });
				const roomMemberAuthorizable = new RoomMemberAuthorizable('', [{ roles: [roleDto], userId: user.id }]);

				return { user, roomMemberAuthorizable };
			};

			it('should return "true" for read action', () => {
				const { user, roomMemberAuthorizable } = setup();

				const res = service.hasPermission(user, roomMemberAuthorizable, {
					action: Action.read,
					requiredPermissions: [],
				});

				expect(res).toBe(true);
			});

			it('should return "false" for write action', () => {
				const { user, roomMemberAuthorizable } = setup();

				const res = service.hasPermission(user, roomMemberAuthorizable, {
					action: Action.write,
					requiredPermissions: [],
				});

				expect(res).toBe(false);
			});
		});

		describe('when user is not member of room', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const roomMemberAuthorizable = new RoomMemberAuthorizable('', []);

				return { user, roomMemberAuthorizable };
			};

			it('should return "false" for read action', () => {
				const { user, roomMemberAuthorizable } = setup();

				const res = service.hasPermission(user, roomMemberAuthorizable, {
					action: Action.read,
					requiredPermissions: [],
				});

				expect(res).toBe(false);
			});

			it('should return "false" for write action', () => {
				const { user, roomMemberAuthorizable } = setup();

				const res = service.hasPermission(user, roomMemberAuthorizable, {
					action: Action.write,
					requiredPermissions: [],
				});

				expect(res).toBe(false);
			});
		});
	});
});
