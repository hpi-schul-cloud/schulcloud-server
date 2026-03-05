import {
	Action,
	AUTHORIZATION_CONFIG_TOKEN,
	AuthorizationHelper,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { authorizationContextFactory } from '@modules/authorization/testing';
import { RoleName } from '@modules/role';
import { roleDtoFactory } from '@modules/role/testing';
import { roomInvitationLinkTestFactory } from '@modules/room/testing/room-invitation-link.test.factory';
import { RoomPublicApiConfig } from '@modules/room';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { RoomInvitationLinkError } from '@modules/room/api/dto/response/room-invitation-link.error';
import { RoomAuthorizable } from '../do/room-authorizable.do';
import { RoomInvitationLinkAuthorizable } from '../do/room-invitation-link-authorizable.do';
import { RoomInvitationLinkRule } from './room-invitation-link.rule';
import { ObjectId } from '@mikro-orm/mongodb';

describe(RoomInvitationLinkRule.name, () => {
	let service: RoomInvitationLinkRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RoomInvitationLinkRule,
				AuthorizationHelper,
				AuthorizationInjectionService,
				{ provide: AUTHORIZATION_CONFIG_TOKEN, useValue: {} },
			],
		}).compile();

		injectionService = await module.get(AuthorizationInjectionService);
		service = await module.get(RoomInvitationLinkRule);
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
				const roomInvitationLink = roomInvitationLinkTestFactory.build();
				const roomAuthorizable = new RoomAuthorizable('roomId', [], '69a9a9f030b4d4076fa35978');
				const roomConfig: RoomPublicApiConfig = {
					featureRoomCopyEnabled: true,
					featureRoomLinkInvitationExternalPersonsEnabled: true,
					roomMemberAddExternalPersonRequirementsUrl: null,
					featureRoomAddExternalPersonsEnabled: false,
					featureRoomRegisterExternalPersonsEnabled: false,
					featureAdministrateRoomsEnabled: true,
					roomMemberInfoUrl: 'http://example.com/room-member-info',
				};
				const authorizable = new RoomInvitationLinkAuthorizable(
					roomAuthorizable,
					roomInvitationLink,
					'schoolName',
					roomConfig
				);

				return { user, authorizable };
			};

			it('should return true', () => {
				const { user, authorizable } = setup();
				const result = service.isApplicable(user, authorizable);

				expect(result).toBe(true);
			});
		});

		describe('when entity is not applicable', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				return { user };
			};

			it('should return false', () => {
				const { user } = setup();

				const result = service.isApplicable(user, user);

				expect(result).toBe(false);
			});
		});
	});

	describe('hasPermission', () => {
		const setup = (
			userSchoolId: string,
			authorizableSchoolId: string,
			userRoomPermissions: Permission[],
			requiredPermissions: Permission[] = []
		) => {
			const role = roleDtoFactory.build({ permissions: userRoomPermissions });
			const user = userFactory.buildWithId({ school: { id: userSchoolId } });
			const roomInvitationLink = roomInvitationLinkTestFactory.build();
			const members = [{ userId: user.id, roles: [role], userSchoolId }];
			const roomAuthorizable = new RoomAuthorizable('roomId', members, authorizableSchoolId);
			const roomConfig: RoomPublicApiConfig = {
				featureRoomCopyEnabled: true,
				featureRoomLinkInvitationExternalPersonsEnabled: true,
				roomMemberAddExternalPersonRequirementsUrl: null,
				featureRoomAddExternalPersonsEnabled: false,
				featureRoomRegisterExternalPersonsEnabled: false,
				featureAdministrateRoomsEnabled: true,
				roomMemberInfoUrl: 'http://example.com/room-member-info',
			};
			const authorizable = new RoomInvitationLinkAuthorizable(
				roomAuthorizable,
				roomInvitationLink,
				'schoolName',
				roomConfig
			);
			const context = authorizationContextFactory.build({
				action: Action.read,
				requiredPermissions,
			});

			return { user, authorizable, context };
		};

		describe('when user has no access to school', () => {
			it('should return false', () => {
				const { user, authorizable, context } = setup('69a9a9f030b4d4076fa35978', 'b9a9a9f030b4d4076fa35aaa', [
					Permission.ROOM_MANAGE_INVITATIONLINKS,
				]);

				const result = service.hasPermission(user, authorizable, context);

				expect(result).toBe(false);
			});
		});

		describe('when user lacks required room permissions', () => {
			it('should return false', () => {
				const { user, authorizable, context } = setup(
					'69a9a9f030b4d4076fa35978',
					'69a9a9f030b4d4076fa35978',
					[],
					[Permission.ROOM_MANAGE_INVITATIONLINKS]
				);

				const result = service.hasPermission(user, authorizable, context);

				expect(result).toBe(false);
			});
		});

		describe('when user has access to school and required permissions', () => {
			describe('when action is read', () => {
				it('should return true if user has ROOM_MANAGE_INVITATIONLINKS permission', () => {
					const schoolId = new ObjectId().toHexString();
					const { user, authorizable } = setup(schoolId, schoolId, [Permission.ROOM_MANAGE_INVITATIONLINKS]);
					const context = authorizationContextFactory.build({ action: Action.read, requiredPermissions: [] });

					const result = service.hasPermission(user, authorizable, context);

					expect(result).toBe(true);
				});

				it('should return false if user lacks ROOM_MANAGE_INVITATIONLINKS permission', () => {
					const schoolId = new ObjectId().toHexString();
					const { user, authorizable } = setup(schoolId, schoolId, [Permission.ROOM_LIST_CONTENT]);
					const context = authorizationContextFactory.build({ action: Action.read, requiredPermissions: [] });

					const result = service.hasPermission(user, authorizable, context);

					expect(result).toBe(false);
				});
			});

			describe('when action is write', () => {
				it('should return true if user has ROOM_MANAGE_INVITATIONLINKS permission', () => {
					const schoolId = new ObjectId().toHexString();
					const { user, authorizable } = setup(schoolId, schoolId, [Permission.ROOM_MANAGE_INVITATIONLINKS]);
					const context = authorizationContextFactory.build({ action: Action.write, requiredPermissions: [] });

					const result = service.hasPermission(user, authorizable, context);

					expect(result).toBe(true);
				});

				it('should return false if user lacks ROOM_MANAGE_INVITATIONLINKS permission', () => {
					const schoolId = new ObjectId().toHexString();
					const { user, authorizable } = setup(schoolId, schoolId, [Permission.ROOM_LIST_CONTENT]);
					const context = authorizationContextFactory.build({ action: Action.write, requiredPermissions: [] });

					const result = service.hasPermission(user, authorizable, context);

					expect(result).toBe(false);
				});
			});
		});
	});

	describe('listAllowedOperations', () => {
		const setup = (
			userRole: RoleName,
			linkConfig: {
				isUsableByStudents?: boolean;
				isUsableByExternalPersons?: boolean;
				restrictedToCreatorSchool?: boolean;
				activeUntil?: Date;
			} = {},
			featureEnabled = true,
			userSchoolId = '507f1f77bcf86cd799439011',
			linkCreatorSchoolId = '507f1f77bcf86cd799439011'
		) => {
			let user: User;
			if (userRole === RoleName.TEACHER) {
				user = userFactory.asTeacher().buildWithId();
			} else if (userRole === RoleName.STUDENT) {
				user = userFactory.asStudent().buildWithId();
			} else if (userRole === RoleName.EXTERNALPERSON) {
				user = userFactory.asExternalPerson().buildWithId();
			} else {
				user = userFactory.asAdmin().buildWithId();
			}
			user.school.id = userSchoolId;

			const roomInvitationLink = roomInvitationLinkTestFactory.build({
				isUsableByStudents: linkConfig.isUsableByStudents ?? false,
				isUsableByExternalPersons: linkConfig.isUsableByExternalPersons ?? false,
				restrictedToCreatorSchool: linkConfig.restrictedToCreatorSchool ?? false,
				activeUntil: linkConfig.activeUntil ?? new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
				creatorSchoolId: linkCreatorSchoolId,
			});
			const roomAuthorizable = new RoomAuthorizable('roomId', [], '69a9a9f030b4d4076fa35978');
			const roomConfig: RoomPublicApiConfig = {
				featureRoomCopyEnabled: true,
				featureRoomLinkInvitationExternalPersonsEnabled: featureEnabled,
				roomMemberAddExternalPersonRequirementsUrl: null,
				featureRoomAddExternalPersonsEnabled: false,
				featureRoomRegisterExternalPersonsEnabled: false,
				featureAdministrateRoomsEnabled: true,
				roomMemberInfoUrl: 'http://example.com/room-member-info',
			};
			const authorizable = new RoomInvitationLinkAuthorizable(
				roomAuthorizable,
				roomInvitationLink,
				'schoolName',
				roomConfig
			);

			return { user, authorizable };
		};

		describe('for teacher users', () => {
			it('should allow useRoomInvitationLinks', () => {
				const { user, authorizable } = setup(RoleName.TEACHER);

				const result = service.listAllowedOperations(user, authorizable);

				expect(result.useRoomInvitationLinks).toBe(true);
			});
		});

		describe('for student users', () => {
			it('should allow useRoomInvitationLinks when link is usable by students', () => {
				const { user, authorizable } = setup(RoleName.STUDENT, { isUsableByStudents: true });

				const result = service.listAllowedOperations(user, authorizable);

				expect(result.useRoomInvitationLinks).toBe(true);
			});

			it('should not allow useRoomInvitationLinks when link is not usable by students', () => {
				const { user, authorizable } = setup(RoleName.STUDENT, { isUsableByStudents: false });

				const result = service.listAllowedOperations(user, authorizable);

				expect(result.useRoomInvitationLinks).toBe(false);
			});

			it('should not allow useRoomInvitationLinks when student is from different school', () => {
				const { user, authorizable } = setup(
					RoleName.STUDENT,
					{ isUsableByStudents: true },
					true,
					'507f1f77bcf86cd799439012',
					'507f1f77bcf86cd799439011'
				);

				const result = service.listAllowedOperations(user, authorizable);

				expect(result.useRoomInvitationLinks).toBe(false);
			});
		});

		describe('for external person users', () => {
			it('should allow useRoomInvitationLinks when link is usable by external persons and feature is enabled', () => {
				const { user, authorizable } = setup(RoleName.EXTERNALPERSON, { isUsableByExternalPersons: true }, true);

				const result = service.listAllowedOperations(user, authorizable);

				expect(result.useRoomInvitationLinks).toBe(true);
			});

			it('should not allow useRoomInvitationLinks when feature is disabled', () => {
				const { user, authorizable } = setup(RoleName.EXTERNALPERSON, { isUsableByExternalPersons: true }, false);

				const result = service.listAllowedOperations(user, authorizable);

				expect(result.useRoomInvitationLinks).toBe(false);
			});

			it('should not allow useRoomInvitationLinks when link is not usable by external persons', () => {
				const { user, authorizable } = setup(RoleName.EXTERNALPERSON, { isUsableByExternalPersons: false }, true);

				const result = service.listAllowedOperations(user, authorizable);

				expect(result.useRoomInvitationLinks).toBe(false);
			});
		});

		describe('when link is expired', () => {
			it('should not allow useRoomInvitationLinks', () => {
				const expiredDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
				const { user, authorizable } = setup(RoleName.TEACHER, { activeUntil: expiredDate });

				const result = service.listAllowedOperations(user, authorizable);

				expect(result.useRoomInvitationLinks).toBe(false);
			});
		});

		describe('when link is restricted to creator school', () => {
			it('should not allow useRoomInvitationLinks for users from different schools', () => {
				const { user, authorizable } = setup(
					RoleName.TEACHER,
					{ restrictedToCreatorSchool: true },
					true,
					'507f1f77bcf86cd799439013',
					'507f1f77bcf86cd799439014'
				);

				const result = service.listAllowedOperations(user, authorizable);

				expect(result.useRoomInvitationLinks).toBe(false);
			});

			it('should allow useRoomInvitationLinks for users from same school', () => {
				const { user, authorizable } = setup(
					RoleName.TEACHER,
					{ restrictedToCreatorSchool: true },
					true,
					'69a9a9f030b4d4076fa35978',
					'69a9a9f030b4d4076fa35978'
				);

				const result = service.listAllowedOperations(user, authorizable);

				expect(result.useRoomInvitationLinks).toBe(true);
			});
		});
	});

	describe('can', () => {
		const setup = () => {
			const user = userFactory.asTeacher().buildWithId();
			const roomInvitationLink = roomInvitationLinkTestFactory.build();
			const roomAuthorizable = new RoomAuthorizable('roomId', [], '69a9a9f030b4d4076fa35978');
			const roomConfig: RoomPublicApiConfig = {
				featureRoomCopyEnabled: true,
				featureRoomLinkInvitationExternalPersonsEnabled: true,
				roomMemberAddExternalPersonRequirementsUrl: null,
				featureRoomAddExternalPersonsEnabled: false,
				featureRoomRegisterExternalPersonsEnabled: false,
				featureAdministrateRoomsEnabled: true,
				roomMemberInfoUrl: 'http://example.com/room-member-info',
			};
			const authorizable = new RoomInvitationLinkAuthorizable(
				roomAuthorizable,
				roomInvitationLink,
				'schoolName',
				roomConfig
			);

			return { user, authorizable };
		};

		it('should return true when operation is allowed', () => {
			const { user, authorizable } = setup();

			const result = service.can('useRoomInvitationLinks', user, authorizable);

			expect(result).toBe(true);
		});

		it('should return false when operation throws an error', () => {
			const { user, authorizable } = setup();
			const expiredDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
			authorizable.roomInvitationLink.activeUntil = expiredDate;

			const result = service.can('useRoomInvitationLinks', user, authorizable);

			expect(result).toBe(false);
		});
	});

	describe('hasRequiredRoomPermissions', () => {
		it('should return true when user has all required permissions', () => {
			const userPermissions = [Permission.ROOM_LIST_CONTENT, Permission.ROOM_MANAGE_INVITATIONLINKS];
			const requiredPermissions = [Permission.ROOM_LIST_CONTENT];

			const result = (
				service as unknown as { hasRequiredRoomPermissions: (up: Permission[], rp: Permission[]) => boolean }
			).hasRequiredRoomPermissions(userPermissions, requiredPermissions);

			expect(result).toBe(true);
		});

		it('should return false when user lacks some required permissions', () => {
			const userPermissions = [Permission.ROOM_LIST_CONTENT];
			const requiredPermissions = [Permission.ROOM_LIST_CONTENT, Permission.ROOM_MANAGE_INVITATIONLINKS];

			const result = (
				service as unknown as { hasRequiredRoomPermissions: (up: Permission[], rp: Permission[]) => boolean }
			).hasRequiredRoomPermissions(userPermissions, requiredPermissions);

			expect(result).toBe(false);
		});

		it('should return true when no permissions are required', () => {
			const userPermissions = [Permission.ROOM_LIST_CONTENT];
			const requiredPermissions: Permission[] = [];

			const result = (
				service as unknown as { hasRequiredRoomPermissions: (up: Permission[], rp: Permission[]) => boolean }
			).hasRequiredRoomPermissions(userPermissions, requiredPermissions);

			expect(result).toBe(true);
		});
	});

	describe('error cases in useRoomInvitationLinks operation', () => {
		const setup = (
			userRole: RoleName,
			linkConfig: {
				isUsableByStudents?: boolean;
				isUsableByExternalPersons?: boolean;
				restrictedToCreatorSchool?: boolean;
				activeUntil?: Date;
			} = {},
			featureEnabled = true,
			userSchoolId = '69a9a9f030b4d4076fa35978',
			linkCreatorSchoolId = '69a9a9f030b4d4076fa35978'
		) => {
			let user: User;
			if (userRole === RoleName.TEACHER) {
				user = userFactory.asTeacher().buildWithId();
			} else if (userRole === RoleName.STUDENT) {
				user = userFactory.asStudent().buildWithId();
			} else if (userRole === RoleName.EXTERNALPERSON) {
				user = userFactory.asExternalPerson().buildWithId();
			} else {
				user = userFactory.asAdmin().buildWithId();
			}
			user.school.id = userSchoolId;

			const roomInvitationLink = roomInvitationLinkTestFactory.build({
				isUsableByStudents: linkConfig.isUsableByStudents ?? false,
				isUsableByExternalPersons: linkConfig.isUsableByExternalPersons ?? false,
				restrictedToCreatorSchool: linkConfig.restrictedToCreatorSchool ?? false,
				activeUntil: linkConfig.activeUntil ?? new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
				creatorSchoolId: linkCreatorSchoolId,
			});
			const roomAuthorizable = new RoomAuthorizable('roomId', [], '69a9a9f030b4d4076fa35978');
			const roomConfig: RoomPublicApiConfig = {
				featureRoomCopyEnabled: true,
				featureRoomLinkInvitationExternalPersonsEnabled: featureEnabled,
				roomMemberAddExternalPersonRequirementsUrl: null,
				featureRoomAddExternalPersonsEnabled: false,
				featureRoomRegisterExternalPersonsEnabled: false,
				featureAdministrateRoomsEnabled: true,
				roomMemberInfoUrl: 'http://example.com/room-member-info',
			};
			const authorizable = new RoomInvitationLinkAuthorizable(
				roomAuthorizable,
				roomInvitationLink,
				'schoolName',
				roomConfig
			);

			return { user, authorizable };
		};

		it('should throw RoomInvitationLinkError when link is expired', () => {
			const expiredDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
			const { user, authorizable } = setup(RoleName.TEACHER, { activeUntil: expiredDate });

			expect(() => service.check('useRoomInvitationLinks', user, authorizable)).toThrow(RoomInvitationLinkError);
		});

		it('should throw RoomInvitationLinkError when role is not valid for link', () => {
			const { user, authorizable } = setup(RoleName.STUDENT, { isUsableByStudents: false });

			expect(() => service.check('useRoomInvitationLinks', user, authorizable)).toThrow(RoomInvitationLinkError);
		});

		it('should throw FeatureDisabledLoggableException when external persons feature is disabled', () => {
			const { user, authorizable } = setup(RoleName.EXTERNALPERSON, { isUsableByExternalPersons: true }, false);

			expect(() => service.check('useRoomInvitationLinks', user, authorizable)).toThrow(
				FeatureDisabledLoggableException
			);
		});

		it('should throw RoomInvitationLinkError when link is restricted to creator school but user is from different school', () => {
			const { user, authorizable } = setup(
				RoleName.TEACHER,
				{ restrictedToCreatorSchool: true },
				true,
				'507f1f77bcf86cd799439015',
				'507f1f77bcf86cd799439016'
			);

			expect(() => service.check('useRoomInvitationLinks', user, authorizable)).toThrow(RoomInvitationLinkError);
		});

		it('should throw RoomInvitationLinkError when student is from different school', () => {
			const { user, authorizable } = setup(
				RoleName.STUDENT,
				{ isUsableByStudents: true },
				true,
				'507f1f77bcf86cd799439017',
				'507f1f77bcf86cd799439018'
			);

			expect(() => service.check('useRoomInvitationLinks', user, authorizable)).toThrow(RoomInvitationLinkError);
		});
	});
});
