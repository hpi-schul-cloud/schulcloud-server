import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException, NotFoundException, NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ALL_RULES, BaseEntity, Permission, AuthorizationContextBuilder } from '@shared/domain';
import {
	courseFactory,
	courseGroupFactory,
	lessonFactory,
	roleFactory,
	schoolFactory,
	setupEntities,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { AuthorizationService } from './authorization.service';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

class TestEntity extends BaseEntity {}

describe('AuthorizationService', () => {
	let service: AuthorizationService;
	let loader: DeepMocked<ReferenceLoader>;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationService,
				...ALL_RULES,
				{
					provide: ReferenceLoader,
					useValue: createMock<ReferenceLoader>(),
				},
			],
		}).compile();

		service = await module.get(AuthorizationService);
		loader = await module.get(ReferenceLoader);
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.restoreAllMocks();
	});

	describe('hasPermission', () => {
		describe('when rule not exist', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.build();
				const entity = new TestEntity();
				return { context, entity, user };
			};

			it('should throw NotImplementedException ', () => {
				const { context, entity, user } = setup();

				const exec = () => {
					service.hasPermission(user, entity, context);
				};
				expect(exec).toThrowError(NotImplementedException);
			});
		});

		describe('when can resolve', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([Permission.BASE_VIEW]);
				const school = schoolFactory.build();
				const role = roleFactory.build({ permissions: [Permission.BASE_VIEW] });
				const user = userFactory.buildWithId({ school, roles: [role] });
				const course = courseFactory.build({ teachers: [user] });
				const lesson = lessonFactory.build({ course });
				const task = taskFactory.build({ creator: user });
				const submission = submissionFactory.build({ task, student: user });
				const courseGroup = courseGroupFactory.build({ course });
				const teamRoleA = roleFactory.build({ permissions: [Permission.CHANGE_TEAM_ROLES] });
				const teamRole = roleFactory.build({ permissions: [Permission.TEAM_INVITE_EXTERNAL], roles: [teamRoleA] });
				const team = teamFactory.withRoleAndUserId(teamRole, user.id).build();

				return {
					context,
					course,
					courseGroup,
					lesson,
					role,
					school,
					submission,
					task,
					team,
					user,
				};
			};

			it('lesson', () => {
				const { context, lesson, user } = setup();

				const response = service.hasPermission(user, lesson, context);

				expect(response).toBe(true);
			});

			it('tasks', () => {
				const { context, task, user } = setup();

				const response = service.hasPermission(user, task, context);

				expect(response).toBe(true);
			});

			it('courses', () => {
				const { context, course, user } = setup();

				const response = service.hasPermission(user, course, context);

				expect(response).toBe(true);
			});

			it('school', () => {
				const { context, school, user } = setup();

				const response = service.hasPermission(user, school, context);

				expect(response).toBe(true);
			});

			it('user', () => {
				const { context, user } = setup();

				const response = service.hasPermission(user, user, context);

				expect(response).toBe(true);
			});

			it('team', () => {
				const { team, user } = setup();

				const context = AuthorizationContextBuilder.read([Permission.CHANGE_TEAM_ROLES]);
				const response = service.hasPermission(user, team, context);

				expect(response).toBe(true);
			});

			it('courseGroup', () => {
				const { context, courseGroup, user } = setup();

				const response = service.hasPermission(user, courseGroup, context);

				expect(response).toBe(true);
			});

			it('submission', () => {
				const { context, submission, user } = setup();

				const response = service.hasPermission(user, submission, context);

				expect(response).toBe(true);
			});
		});
	});

	describe('checkPermission', () => {
		describe('when data successfully', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.build();
				const spyHasPermission = jest.spyOn(service, 'hasPermission').mockReturnValue(true);
				return { context, user, spyHasPermission };
			};

			it('should call AuthorizationService.hasPermission with specific arguments', () => {
				const { context, user, spyHasPermission } = setup();
				service.checkPermission(user, user, context);

				expect(spyHasPermission).toBeCalledWith(user, user, context);

				spyHasPermission.mockRestore();
			});
		});

		describe('when data not successfully', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.build();
				const spyHasPermission = jest.spyOn(service, 'hasPermission').mockReturnValue(false);
				return { context, user, spyHasPermission };
			};

			it('should throw ForbiddenException', () => {
				const { context, user, spyHasPermission } = setup();

				expect(() => service.checkPermission(user, user, context)).toThrowError(ForbiddenException);

				spyHasPermission.mockRestore();
			});
		});
	});

	describe('hasPermissionByReferences', () => {
		describe('when ReferenceLoader.loadEntity throw an error', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const userId = new ObjectId().toHexString();
				const entityName = AllowedAuthorizationEntityType.Course;
				const entityId = new ObjectId().toHexString();

				loader.loadEntity.mockRejectedValueOnce(new NotFoundException());
				const spyGetUserWithPermissions = jest
					.spyOn(service, 'getUserWithPermissions')
					.mockRejectedValueOnce(new NotFoundException());

				return { context, userId, entityName, entityId, spyGetUserWithPermissions };
			};

			it('should throw ForbiddenException', async () => {
				const { context, userId, entityName, entityId, spyGetUserWithPermissions } = setup();

				await expect(service.hasPermissionByReferences(userId, entityName, entityId, context)).rejects.toThrowError(
					ForbiddenException
				);

				spyGetUserWithPermissions.mockRestore();
			});
		});

		describe('when data successfully', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const entityName = AllowedAuthorizationEntityType.Course;
				const entityId = course.id;
				const spyGetUserWithPermissions = jest.spyOn(service, 'getUserWithPermissions').mockResolvedValueOnce(user);
				const spyHasPermission = jest.spyOn(service, 'hasPermission').mockReturnValue(true);
				loader.loadEntity.mockResolvedValueOnce(course);

				return { context, course, user, entityName, entityId, spyGetUserWithPermissions, spyHasPermission };
			};

			it('should call AuthorizationService.getUserWithPermissions with specific arguments', async () => {
				const { context, user, entityName, entityId, spyGetUserWithPermissions } = setup();

				await service.hasPermissionByReferences(user.id, entityName, entityId, context);

				expect(spyGetUserWithPermissions).toBeCalledWith(user.id);

				spyGetUserWithPermissions.mockRestore();
			});

			it('should call ReferenceLoader.loadEntity with specific arguments', async () => {
				const { context, user, entityName, entityId, spyHasPermission } = setup();

				await service.hasPermissionByReferences(user.id, entityName, entityId, context);

				expect(loader.loadEntity).toBeCalledWith(entityName, entityId);

				spyHasPermission.mockRestore();
			});

			it('should call AuthorizationService.hasPermission with specific arguments', async () => {
				const { context, user, entityName, course, entityId, spyHasPermission } = setup();

				await service.hasPermissionByReferences(user.id, entityName, entityId, context);

				expect(spyHasPermission).toBeCalledWith(user, course, context);

				spyHasPermission.mockRestore();
			});

			it('should return true', async () => {
				const { context, user, entityName, entityId } = setup();

				const result = await service.hasPermissionByReferences(user.id, entityName, entityId, context);

				expect(result).toStrictEqual(true);
			});
		});
	});

	describe('checkPermissionByReferences', () => {
		describe('when hasPermissionByReferences return false', () => {
			const setup = () => {
				const context = AuthorizationContextBuilder.read([]);
				const userId = new ObjectId().toHexString();
				const entityName = AllowedAuthorizationEntityType.Course;
				const entityId = new ObjectId().toHexString();
				const spyHasPermissionByReferences = jest
					.spyOn(service, 'hasPermissionByReferences')
					.mockResolvedValueOnce(false);

				return { context, userId, entityName, entityId, spyHasPermissionByReferences };
			};

			it('should throw ForbiddenException', async () => {
				const { context, userId, entityName, entityId, spyHasPermissionByReferences } = setup();

				await expect(() =>
					service.checkPermissionByReferences(userId, entityName, entityId, context)
				).rejects.toThrowError(ForbiddenException);

				spyHasPermissionByReferences.mockRestore();
			});
		});
	});

	describe('getUserWithPermissions', () => {
		describe('when user successfully', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				loader.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
				};
			};

			it('should call ReferenceLoader.getUserWithPermissions with specific arguments', async () => {
				const { user } = setup();

				await service.getUserWithPermissions(user.id);

				expect(loader.getUserWithPermissions).toBeCalledWith(user.id);
			});

			it('should return user', async () => {
				const { user } = setup();

				const res = await service.getUserWithPermissions(user.id);

				expect(res).toStrictEqual(user);
			});
		});

		describe('when user can not be found', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const error = new NotFoundException();

				loader.getUserWithPermissions.mockRejectedValue(error);

				return {
					userId,
					error,
				};
			};
			it('should throw NotFoundException', async () => {
				const { userId, error } = setup();
				await expect(service.getUserWithPermissions(userId)).rejects.toThrowError(error);
			});
		});
	});
});
