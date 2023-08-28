import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { FilesService } from './files.service';
import { FilesRepo } from '../repo';
import { fileEntityFactory } from '../entity/testing';
import { FileEntity, FilePermissionEntity } from '../entity';
import { FilePermissionReferenceModel } from '../domain';

describe(FilesService.name, () => {
	let module: TestingModule;
	let service: FilesService;
	let repo: DeepMocked<FilesRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesService,
				{
					provide: FilesRepo,
					useValue: createMock<FilesRepo>(),
				},
			],
		}).compile();

		service = module.get(FilesService);
		repo = module.get(FilesRepo);

		await setupEntities();
	});

	afterEach(() => {
		repo.findByPermissionRefId.mockClear();
		repo.findByOwnerUserId.mockClear();
		repo.save.mockClear();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('removeUserPermissionsToAnyFiles', () => {
		it('should not modify any files if there are none that user has permission to access', async () => {
			const userId = new ObjectId().toHexString();
			repo.findByPermissionRefId.mockResolvedValueOnce([]);

			const result = await service.removeUserPermissionsToAnyFiles(userId);

			expect(result).toEqual(0);

			expect(repo.findByPermissionRefId).toBeCalledWith(userId);
			expect(repo.save).not.toBeCalled();
		});

		describe('should properly remove user permissions', () => {
			it('in case of just a single file accessible by given user', async () => {
				const userId = new ObjectId().toHexString();
				const userPermission = new FilePermissionEntity({
					refId: userId,
					refPermModel: FilePermissionReferenceModel.USER,
				});
				const entity = fileEntityFactory.buildWithId({ permissions: [userPermission] });

				repo.findByPermissionRefId.mockResolvedValueOnce([entity]);

				const result = await service.removeUserPermissionsToAnyFiles(userId);

				expect(result).toEqual(1);
				expect(entity.permissions).not.toContain(userPermission);

				expect(repo.findByPermissionRefId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith([entity]);
			});

			it('in case of many files accessible by given user', async () => {
				const userId = new ObjectId().toHexString();
				const userPermission = new FilePermissionEntity({
					refId: userId,
					refPermModel: FilePermissionReferenceModel.USER,
				});
				const anotherUserPermission = new FilePermissionEntity({
					refId: new ObjectId().toHexString(),
					refPermModel: FilePermissionReferenceModel.USER,
				});
				const yetAnotherUserPermission = new FilePermissionEntity({
					refId: new ObjectId().toHexString(),
					refPermModel: FilePermissionReferenceModel.USER,
				});
				const entities = [
					fileEntityFactory.buildWithId({
						permissions: [userPermission, anotherUserPermission, yetAnotherUserPermission],
					}),
					fileEntityFactory.buildWithId({
						permissions: [yetAnotherUserPermission, userPermission, anotherUserPermission],
					}),
					fileEntityFactory.buildWithId({
						permissions: [anotherUserPermission, yetAnotherUserPermission, userPermission],
					}),
					fileEntityFactory.buildWithId({
						permissions: [userPermission, yetAnotherUserPermission, anotherUserPermission],
					}),
					fileEntityFactory.buildWithId({
						permissions: [yetAnotherUserPermission, anotherUserPermission, userPermission],
					}),
				];

				repo.findByPermissionRefId.mockResolvedValueOnce(entities);

				const result = await service.removeUserPermissionsToAnyFiles(userId);

				expect(result).toEqual(5);

				entities.forEach((entity) => {
					expect(entity.permissions).not.toContain(userPermission);
					expect(entity.permissions).toContain(anotherUserPermission);
					expect(entity.permissions).toContain(yetAnotherUserPermission);
				});

				expect(repo.findByPermissionRefId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith(entities);
			});
		});
	});

	describe('markFilesOwnedByUserForDeletion', () => {
		const verifyEntityChanges = (entity: FileEntity) => {
			expect(entity.deleted).toEqual(true);

			const deletedAtTime = entity.deletedAt?.getTime();

			expect(deletedAtTime).toBeGreaterThan(0);
			expect(deletedAtTime).toBeLessThanOrEqual(new Date().getTime());
		};

		it('should not mark any files for deletion if there are none owned by given user', async () => {
			const userId = new ObjectId().toHexString();
			repo.findByOwnerUserId.mockResolvedValueOnce([]);

			const result = await service.markFilesOwnedByUserForDeletion(userId);

			expect(result).toEqual(0);

			expect(repo.findByOwnerUserId).toBeCalledWith(userId);
			expect(repo.save).not.toBeCalled();
		});

		describe('should properly mark files for deletion', () => {
			it('in case of just a single file owned by given user', async () => {
				const entity = fileEntityFactory.buildWithId();
				const userId = entity.ownerId;
				repo.findByOwnerUserId.mockResolvedValueOnce([entity]);

				const result = await service.markFilesOwnedByUserForDeletion(userId);

				expect(result).toEqual(1);
				verifyEntityChanges(entity);

				expect(repo.findByOwnerUserId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith([entity]);
			});

			it('in case of many files owned by the user', async () => {
				const userId = new ObjectId().toHexString();
				const entities = [
					fileEntityFactory.buildWithId({ ownerId: userId }),
					fileEntityFactory.buildWithId({ ownerId: userId }),
					fileEntityFactory.buildWithId({ ownerId: userId }),
					fileEntityFactory.buildWithId({ ownerId: userId }),
					fileEntityFactory.buildWithId({ ownerId: userId }),
				];
				repo.findByOwnerUserId.mockResolvedValueOnce(entities);

				const result = await service.markFilesOwnedByUserForDeletion(userId);

				expect(result).toEqual(5);
				entities.forEach((entity) => verifyEntityChanges(entity));

				expect(repo.findByOwnerUserId).toBeCalledWith(userId);
				expect(repo.save).toBeCalledWith(entities);
			});
		});
	});
});
