import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { setupEntities } from '@shared/testing';

import { FilesService } from './files.service';
import { FilesRepo } from '../repo';
import { userFileFactory } from '../entity/testing';
import { FileEntity } from '../entity';

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

	afterAll(async () => {
		await module.close();
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

		describe('should properly mark files owned by the user for deletion', () => {
			it('in case of just a single file owned by the user', async () => {
				const entity = userFileFactory.buildWithId();
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
					userFileFactory.buildWithId({ ownerId: userId }),
					userFileFactory.buildWithId({ ownerId: userId }),
					userFileFactory.buildWithId({ ownerId: userId }),
					userFileFactory.buildWithId({ ownerId: userId }),
					userFileFactory.buildWithId({ ownerId: userId }),
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
