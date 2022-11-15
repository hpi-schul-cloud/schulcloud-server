import { NotFound } from '@feathersjs/errors';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException, NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	Actions,
	ALL_RULES,
	BaseEntity,
	IAuthorizationContext,
	Permission,
	AuthorizationContextBuilder,
	AuthorizableObject,
	User,
} from '@shared/domain';
import {
	courseFactory,
	courseGroupFactory,
	lessonFactory,
	roleFactory,
	schoolFactory,
	setupEntities,
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
		const context = AuthorizationContextBuilder.write([]);

		it('throw an error if no rule exist', () => {
			const user = userFactory.build();
			const entity = new TestEntity();

			const exec = () => {
				service.hasPermission(user, entity, context);
			};
			expect(exec).toThrowError(NotImplementedException);
		});

		it('can resolve lesson', () => {
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });
			const lesson = lessonFactory.build({ course });
			const response = service.hasPermission(user, lesson, context);
			expect(response).toBe(true);
		});

		it('can resolve tasks', () => {
			const user = userFactory.build();
			const task = taskFactory.build({ creator: user });

			const response = service.hasPermission(user, task, context);
			expect(response).toBe(true);
		});

		it('can resolve courses', () => {
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });

			const response = service.hasPermission(user, course, context);
			expect(response).toBe(true);
		});

		it('can resolve school', () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });

			const response = service.hasPermission(user, school, context);
			expect(response).toBe(true);
		});

		it('can resolve user', () => {
			const user = userFactory.build();

			const response = service.hasPermission(user, user, context);
			expect(response).toBe(true);
		});

		it('can resolve team', () => {
			const role = roleFactory.build({ permissions: [Permission.CHANGE_TEAM_ROLES] });
			const user = userFactory.build({ roles: [role] });
			const team = teamFactory.withRoleAndUserId(role, user.id).build();

			const response = service.hasPermission(team.teamUsers[0].user, team, context);
			expect(response).toBe(true);
		});

		it('can resolve courseGroup', () => {
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });
			const courseGroup = courseGroupFactory.build({ course });

			const response = service.hasPermission(user, courseGroup, context);
			expect(response).toBe(true);
		});
	});

	describe('checkPermission', () => {
		const context = AuthorizationContextBuilder.write([]);

		it('should call this.hasPermission', () => {
			const user = userFactory.build();

			const spy = jest.spyOn(service, 'hasPermission').mockReturnValue(true);
			service.checkPermission(user, user, context);

			expect(spy).toBeCalled();

			spy.mockRestore();
		});

		it('should call this.hasPermission', () => {
			const user = userFactory.build();

			const spy = jest.spyOn(service, 'hasPermission').mockReturnValue(false);

			expect(() => service.checkPermission(user, user, context)).toThrowError(ForbiddenException);

			spy.mockRestore();
		});
	});

	describe('hasPermissionByReferences', () => {
		const context = AuthorizationContextBuilder.read([]);

		it('should call ReferenceLoader.loadEntity', async () => {
			const userId = new ObjectId().toHexString();
			const entityName = AllowedAuthorizationEntityType.Course;
			const entityId = new ObjectId().toHexString();
			const spy = jest.spyOn(service, 'hasPermission');
			spy.mockReturnValue(true);

			await service.hasPermissionByReferences(userId, entityName, entityId, context);

			expect(loader.loadEntity).nthCalledWith(1, AllowedAuthorizationEntityType.User, userId);
			expect(loader.loadEntity).nthCalledWith(2, entityName, entityId);

			spy.mockRestore();
		});

		it('Should throw ForbiddenException if entity by id can not be found.', async () => {
			loader.loadEntity.mockRejectedValueOnce(new NotFound());

			const userId = new ObjectId().toHexString();
			const entityName = AllowedAuthorizationEntityType.Course;
			const entityId = new ObjectId().toHexString();
			const spy = jest.spyOn(service, 'hasPermission');
			spy.mockReturnValue(true);

			await expect(service.hasPermissionByReferences(userId, entityName, entityId, context)).rejects.toThrowError(
				ForbiddenException
			);

			spy.mockRestore();
		});
	});

	describe('checkPermissionByReferences', () => {
		const context = AuthorizationContextBuilder.read([]);

		it('should call ReferenceLoader.getUserWithPermissions', async () => {
			const userId = new ObjectId().toHexString();
			const entityName = AllowedAuthorizationEntityType.Course;
			const entityId = new ObjectId().toHexString();
			const spy = jest.spyOn(service, 'hasPermission');
			spy.mockReturnValue(false);

			await expect(() =>
				service.checkPermissionByReferences(userId, entityName, entityId, context)
			).rejects.toThrowError(ForbiddenException);

			spy.mockRestore();
		});
	});

	describe('checkPermissionsByReferences', () => {
		const permissionTrue = 'true' as Permission;
		const permissionFalse = 'false' as Permission;

		it('should call ReferenceLoader.getUserWithPermissions', async () => {
			const userId = new ObjectId().toHexString();
			const entityName = AllowedAuthorizationEntityType.Course;
			const entityId = new ObjectId().toHexString();
			const spy = jest.spyOn(service, 'hasPermission');
			spy.mockImplementation((user: User, entity: AuthorizableObject, context: IAuthorizationContext) => {
				return context.requiredPermissions[0] === permissionTrue;
			});

			const retMap = service.hasPermissionsByReferences(
				userId,
				entityName,
				entityId,
				[permissionTrue, permissionFalse],
				Actions.read
			);

			expect(await retMap.get(permissionTrue)).toBe(true);
			expect(await retMap.get(permissionFalse)).toBe(false);

			spy.mockRestore();
		});
	});

	describe('getUserWithPermissions', () => {
		it('Should call ReferenceLoader.getUserWithPermissions.', async () => {
			const userId = new ObjectId().toHexString();

			await service.getUserWithPermissions(userId);
			expect(loader.loadEntity).lastCalledWith(AllowedAuthorizationEntityType.User, userId);
		});

		it('Should throw ForbiddenException if user by id can not be found.', async () => {
			loader.loadEntity.mockRejectedValueOnce(new NotFound());

			const userId = new ObjectId().toHexString();

			await expect(service.getUserWithPermissions(userId)).rejects.toThrowError(ForbiddenException);
		});
	});
});
