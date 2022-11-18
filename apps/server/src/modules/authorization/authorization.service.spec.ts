import { NotFound } from '@feathersjs/errors';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException, NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ALL_RULES, BaseEntity, Permission, PermissionContextBuilder } from '@shared/domain';
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

describe('authorization.service', () => {
	let orm: MikroORM;
	let service: AuthorizationService;
	let loader: DeepMocked<ReferenceLoader>;

	beforeAll(async () => {
		orm = await setupEntities();

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

	afterAll(async () => {
		await orm.close();
	});

	describe('hasPermission', () => {
		const setup = () => {
			const context = PermissionContextBuilder.read([Permission.BASE_VIEW]);
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

		describe('if rule not exist', () => {
			it('should throw NotImplementedException ', () => {
				const { context, user } = setup();
				const entity = new TestEntity();

				const exec = () => {
					service.hasPermission(user, entity, context);
				};
				expect(exec).toThrowError(NotImplementedException);
			});
		});
		describe('can resolve', () => {
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
				const context = PermissionContextBuilder.read([Permission.CHANGE_TEAM_ROLES]);
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
		const setup = () => {
			const context = PermissionContextBuilder.read([]);
			const user = userFactory.build();
			return { context, user };
		};

		it('should call this.hasPermission', () => {
			const { context, user } = setup();
			const spy = jest.spyOn(service, 'hasPermission').mockReturnValue(true);
			service.checkPermission(user, user, context);

			expect(spy).toBeCalled();

			spy.mockRestore();
		});

		it('should throw ForbiddenException', () => {
			const { context, user } = setup();
			const spy = jest.spyOn(service, 'hasPermission').mockReturnValue(false);

			expect(() => service.checkPermission(user, user, context)).toThrowError(ForbiddenException);

			spy.mockRestore();
		});
	});

	describe('hasPermissionByReferences', () => {
		const setup = () => {
			const context = PermissionContextBuilder.read([]);
			const userId = new ObjectId().toHexString();
			const user = userFactory.buildWithId({}, userId);
			const entityName = AllowedAuthorizationEntityType.Course;
			const entityId = new ObjectId().toHexString();
			return { context, userId, user, entityName, entityId };
		};

		it('should call ReferenceLoader.loadEntity', async () => {
			const { context, userId, user, entityName, entityId } = setup();
			const spy = jest.spyOn(service, 'hasPermission');
			spy.mockReturnValue(true);
			loader.loadEntity.mockResolvedValue(user);

			await service.hasPermissionByReferences(userId, entityName, entityId, context);

			expect(loader.loadEntity).nthCalledWith(1, AllowedAuthorizationEntityType.User, userId);
			expect(loader.loadEntity).nthCalledWith(2, entityName, entityId);

			spy.mockRestore();
		});

		it('Should throw ForbiddenException if entity by id can not be found.', async () => {
			const { context, userId, entityName, entityId } = setup();
			loader.loadEntity.mockRejectedValueOnce(new NotFound());
			const spy = jest.spyOn(service, 'hasPermission');
			spy.mockReturnValue(true);

			await expect(service.hasPermissionByReferences(userId, entityName, entityId, context)).rejects.toThrowError(
				ForbiddenException
			);

			spy.mockRestore();
		});
	});

	describe('checkPermissionByReferences', () => {
		const setup = () => {
			const context = PermissionContextBuilder.read([]);
			const userId = new ObjectId().toHexString();
			const entityName = AllowedAuthorizationEntityType.Course;
			const entityId = new ObjectId().toHexString();
			return { context, userId, entityName, entityId };
		};
		it('should call ReferenceLoader.getUserWithPermissions', async () => {
			const { context, userId, entityName, entityId } = setup();
			const spy = jest.spyOn(service, 'hasPermission');
			spy.mockReturnValue(false);

			await expect(() =>
				service.checkPermissionByReferences(userId, entityName, entityId, context)
			).rejects.toThrowError(ForbiddenException);

			spy.mockRestore();
		});
	});

	describe('getUserWithPermissions', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const user = userFactory.buildWithId({}, userId);
			return {
				userId,
				user,
			};
		};
		describe('Gets user successfully', () => {
			it('Should call ReferenceLoader.getUserWithPermissions with params', async () => {
				const { userId } = setup();

				await service.getUserWithPermissions(userId);
				expect(loader.loadEntity).lastCalledWith(AllowedAuthorizationEntityType.User, userId);
			});

			it('Should return user', async () => {
				const { userId, user } = setup();

				loader.loadEntity.mockResolvedValue(user);
				const res = await service.getUserWithPermissions(userId);
				expect(res).toStrictEqual(user);
			});
		});

		describe('User can not be found', () => {
			it('Should throw Error', async () => {
				const userId = new ObjectId().toHexString();
				const error = new Error();
				loader.loadEntity.mockRejectedValue(error);

				await expect(service.getUserWithPermissions(userId)).rejects.toThrowError(error);
			});
		});

		describe('If user is not instanceof User', () => {
			it('Should throw ForbiddenException ', async () => {
				const userId = new ObjectId().toHexString();
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				loader.loadEntity.mockResolvedValue();

				await expect(service.getUserWithPermissions(userId)).rejects.toThrowError(ForbiddenException);
			});
		});
	});
});
