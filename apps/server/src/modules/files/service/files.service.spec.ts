import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { setupEntities } from '@shared/testing';
import { FilesService } from './files.service';
import { FilesRepo } from '../repo';
import { userFileFactory } from '@src/modules/files/entity/testing';

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
		it('should mark files owned by user for deletion', async () => {
			const entity = userFileFactory.buildWithId();
			repo.findByOwnerUserId.mockResolvedValueOnce([entity]);
			const userId = entity.ownerId;

			await service.markFilesOwnedByUserForDeletion(userId);

			expect(entity.deleted).toEqual(true);
			expect(entity.deletedAt?.getTime()).toBeGreaterThan(0);
			expect(entity.deletedAt?.getTime()).toBeLessThanOrEqual(new Date().getTime());

			expect(repo.findByOwnerUserId).toBeCalledWith(userId);
			expect(repo.save).toBeCalledWith([entity]);
		});
	});
});
