import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, ALL_RULES, BaseEntity, UserRule } from '@shared/domain';
import { courseFactory, schoolFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { AuthorizationService, ErrorMessages } from './authorization.service';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

class TestEntity extends BaseEntity {}

describe('authorization.service', () => {
	let orm: MikroORM;
	let service: AuthorizationService;
	let loader: DeepMocked<ReferenceLoader>;
	const context = { action: Actions.write, requiredPermissions: [] };

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

	describe('checkCondition', () => {
		it('throw an error if no rule exist', () => {
			const user = userFactory.build();
			const entity = new TestEntity();

			const exec = () => {
				service.checkCondition(user, entity, context);
			};
			expect(exec).toThrowError(new NotImplementedException(ErrorMessages.RULE_NOT_IMPLEMENT));
		});

		it('throw an error by multiple matches ', () => {
			const user = userFactory.build();
			service.permissionPublisher.push(new UserRule());

			const exec = () => {
				service.checkCondition(user, user, context);
			};
			expect(exec).toThrowError(new InternalServerErrorException(ErrorMessages.MULTIPLE_MATCHES_ARE_NOT_ALLOWED));

			service.permissionPublisher.pop();
		});

		it('can resolve tasks', () => {
			const user = userFactory.build();
			const task = taskFactory.build({ creator: user });

			const response = service.checkCondition(user, task, context);
			expect(response).toBe(true);
		});

		it('can resolve courses', () => {
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });

			const response = service.checkCondition(user, course, context);
			expect(response).toBe(true);
		});

		it('can resolve school', () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });

			const response = service.checkCondition(user, school, context);
			expect(response).toBe(true);
		});

		it('can resolve user', () => {
			const user = userFactory.build();

			const response = service.checkCondition(user, user, context);
			expect(response).toBe(true);
		});
	});

	describe('hasPermission', () => {
		it('throw an error if no rule exist', () => {
			const user = userFactory.build();
			const entity = new TestEntity();

			const exec = () => {
				service.hasPermission(user, entity, context);
			};
			expect(exec).toThrowError(NotImplementedException);
		});

		it('throw an error by multiple matches ', () => {
			const user = userFactory.build();
			service.permissionPublisher.push(new UserRule());

			const exec = () => {
				service.hasPermission(user, user, context);
			};
			expect(exec).toThrowError(new InternalServerErrorException(ErrorMessages.MULTIPLE_MATCHES_ARE_NOT_ALLOWED));

			service.permissionPublisher.pop();
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
	});

	describe('checkPermission', () => {
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
		it('should call ReferenceLoader.getUserWithPermissions', async () => {
			const userId = new ObjectId().toHexString();
			const entityName = AllowedAuthorizationEntityType.Course;
			const entityId = new ObjectId().toHexString();
			const spy = jest.spyOn(service, 'hasPermission');
			spy.mockReturnValue(true);

			await service.hasPermissionByReferences(userId, entityName, entityId, {
				action: Actions.read,
				requiredPermissions: [],
			});

			expect(loader.getUserWithPermissions).lastCalledWith(userId);

			spy.mockRestore();
		});

		it('should call ReferenceLoader.loadEntity', async () => {
			const userId = new ObjectId().toHexString();
			const entityName = AllowedAuthorizationEntityType.Course;
			const entityId = new ObjectId().toHexString();
			const spy = jest.spyOn(service, 'hasPermission');
			spy.mockReturnValue(true);

			await service.hasPermissionByReferences(userId, entityName, entityId, {
				action: Actions.read,
				requiredPermissions: [],
			});

			expect(loader.loadEntity).lastCalledWith(entityName, entityId);

			spy.mockRestore();
		});
	});

	describe('checkPermissionByReferences', () => {
		it('should call ReferenceLoader.getUserWithPermissions', async () => {
			const userId = new ObjectId().toHexString();
			const entityName = AllowedAuthorizationEntityType.Course;
			const entityId = new ObjectId().toHexString();
			const spy = jest.spyOn(service, 'hasPermission');
			spy.mockReturnValue(false);

			await expect(() =>
				service.checkPermissionByReferences(userId, entityName, entityId, {
					action: Actions.read,
					requiredPermissions: [],
				})
			).rejects.toThrowError(ForbiddenException);

			spy.mockRestore();
		});
	});

	describe('getUserWithPermissions', () => {
		it('should call ReferenceLoader.getUserWithPermissions', async () => {
			const userId = new ObjectId().toHexString();

			await service.getUserWithPermissions(userId);
			expect(loader.getUserWithPermissions).lastCalledWith(userId);
		});
	});
});
