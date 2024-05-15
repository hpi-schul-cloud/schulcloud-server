import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, setupEntities, userFactory } from '@shared/testing/factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizableReferenceType } from '../type';
import { AuthorizationService } from './authorization.service';
import { ReferenceLoader } from './reference.loader';
import { AuthorizationContextBuilder } from '../mapper';
import { ForbiddenLoggableException } from '../error';
import { AuthorizationReferenceService } from './authorization-reference.service';

describe('AuthorizationReferenceService', () => {
	let service: AuthorizationReferenceService;
	let authorizationService: DeepMocked<AuthorizationService>;
	let loader: DeepMocked<ReferenceLoader>;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthorizationReferenceService,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: ReferenceLoader,
					useValue: createMock<ReferenceLoader>(),
				},
			],
		}).compile();

		service = await module.get(AuthorizationReferenceService);
		authorizationService = await module.get(AuthorizationService);
		loader = await module.get(ReferenceLoader);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('checkPermissionByReferences', () => {
		const setupData = () => {
			const entityId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const context = AuthorizationContextBuilder.read([]);
			const entityName = AuthorizableReferenceType.Course;

			return { context, entityId, userId, entityName };
		};

		describe('when hasPermissionByReferences returns false', () => {
			const setup = () => {
				const { entityId, userId, context, entityName } = setupData();

				const spy = jest.spyOn(service, 'hasPermissionByReferences').mockResolvedValueOnce(false);

				return { context, userId, entityId, entityName, spy };
			};

			it('should reject with ForbiddenLoggableException', async () => {
				const { context, userId, entityId, entityName, spy } = setup();

				await expect(service.checkPermissionByReferences(userId, entityName, entityId, context)).rejects.toThrow(
					new ForbiddenLoggableException(userId, entityName, context)
				);

				spy.mockRestore();
			});
		});

		describe('when hasPermissionByReferences returns true', () => {
			const setup = () => {
				const { entityId, userId, context, entityName } = setupData();

				const spy = jest.spyOn(service, 'hasPermissionByReferences').mockResolvedValueOnce(true);

				return { context, userId, entityId, entityName, spy };
			};

			it('should resolve without error', async () => {
				const { context, userId, entityId, entityName, spy } = setup();

				await expect(service.checkPermissionByReferences(userId, entityName, entityId, context)).resolves.not.toThrow();

				spy.mockRestore();
			});
		});
	});

	describe('hasPermissionByReferences', () => {
		const setupData = () => {
			const entity = courseFactory.buildWithId();
			const user = userFactory.buildWithId();
			const context = AuthorizationContextBuilder.read([]);
			const entityName = AuthorizableReferenceType.Course;

			return { context, entity, user, entityName };
		};

		describe('when loader throws an error', () => {
			const setup = () => {
				const { entity, user, context, entityName } = setupData();

				loader.loadAuthorizableObject.mockRejectedValueOnce(new NotFoundException());
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermission.mockReturnValueOnce(true);

				return { context, userId: user.id, entityId: entity.id, entityName };
			};

			it('should reject with this error', async () => {
				const { context, userId, entityId, entityName } = setup();

				await expect(service.hasPermissionByReferences(userId, entityName, entityId, context)).rejects.toThrow(
					new NotFoundException()
				);
			});
		});

		describe('when authorizationService throws an error', () => {
			const setup = () => {
				const { entity, user, context, entityName } = setupData();

				loader.loadAuthorizableObject.mockRejectedValueOnce(entity);
				authorizationService.getUserWithPermissions.mockRejectedValueOnce(new NotFoundException());
				authorizationService.hasPermission.mockReturnValueOnce(true);

				return { context, userId: user.id, entityId: entity.id, entityName };
			};

			it('should reject with this error', async () => {
				const { context, userId, entityId, entityName } = setup();

				await expect(service.hasPermissionByReferences(userId, entityName, entityId, context)).rejects.toThrow(
					new NotFoundException()
				);
			});
		});

		describe('when loader can load entites and authorization resolve with true', () => {
			const setup = () => {
				const { entity, user, context, entityName } = setupData();

				loader.loadAuthorizableObject.mockResolvedValueOnce(entity);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermission.mockReturnValueOnce(true);

				return { context, userId: user.id, entityId: entity.id, entityName };
			};

			it('should resolve to true', async () => {
				const { context, userId, entityId, entityName } = setup();

				const result = await service.hasPermissionByReferences(userId, entityName, entityId, context);

				expect(result).toBe(true);
			});
		});

		describe('when loader can load entities and authorization resolve with false', () => {
			const setup = () => {
				const { entity, user, context, entityName } = setupData();

				loader.loadAuthorizableObject.mockResolvedValueOnce(entity);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermission.mockReturnValueOnce(false);

				return { context, userId: user.id, entityId: entity.id, entityName };
			};

			it('should resolve to false', async () => {
				const { context, userId, entityId, entityName } = setup();

				const result = await service.hasPermissionByReferences(userId, entityName, entityId, context);

				expect(result).toBe(false);
			});
		});
	});
});
