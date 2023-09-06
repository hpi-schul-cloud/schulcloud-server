import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, setupEntities, userFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { AuthorizableReferenceType } from './types';
import { AuthorizationService } from '../../authorization.service';
import { ReferenceLoader } from './reference.loader';
import { AuthorizationContextBuilder } from '../../authorization-context.builder';
import { ForbiddenLoggableException } from '../../errors';
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
				loader.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermission.mockReturnValueOnce(true);

				return { context, userId: user.id, entityId: entity.id, entityName };
			};

			it('should reject with ForbiddenLoggableException', async () => {
				const { context, userId, entityId, entityName } = setup();

				await expect(service.hasPermissionByReferences(userId, entityName, entityId, context)).rejects.toThrow(
					new ForbiddenLoggableException(userId, entityName, context)
				);
			});
		});

		describe('when loader can load entites and authorization resolve with true', () => {
			const setup = () => {
				const { entity, user, context, entityName } = setupData();

				loader.loadAuthorizableObject.mockResolvedValueOnce(entity);
				loader.getUserWithPermissions.mockResolvedValueOnce(user);
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
				loader.getUserWithPermissions.mockResolvedValueOnce(user);
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

	describe('getUserWithPermissions', () => {
		describe('when loader can load the user', () => {
			const setup = () => {
				const user = userFactory.build();
				loader.getUserWithPermissions.mockResolvedValueOnce(user);

				return { user };
			};

			it('should return user received from loader', async () => {
				const { user } = setup();

				const result = await service.getUserWithPermissions(user.id);

				expect(result).toEqual(user);
			});
		});

		describe('when loader return with error', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				loader.getUserWithPermissions.mockRejectedValueOnce(new NotFoundException());

				return { userId };
			};

			it('should reject with error', async () => {
				const { userId } = setup();

				await expect(service.getUserWithPermissions(userId)).rejects.toThrowError(new NotFoundException());
			});
		});
	});
});
