import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { setupEntities } from '@shared/testing';
import { FilesService } from '../service';
import { FilesUC } from './files.uc';

describe(FilesUC.name, () => {
	let module: TestingModule;
	let uc: FilesUC;
	let service: DeepMocked<FilesService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesUC,
				{
					provide: FilesService,
					useValue: createMock<FilesService>(),
				},
			],
		}).compile();

		uc = module.get(FilesUC);
		service = module.get(FilesService);

		await setupEntities();
	});

	afterEach(() => {
		service.removeUserPermissionsToAnyFiles.mockClear();
		service.markFilesOwnedByUserForDeletion.mockClear();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('deleteUserData', () => {
		it('should call proper service methods with given userId', async () => {
			const userId = new ObjectId().toHexString();

			await uc.deleteUserData(userId);

			expect(service.removeUserPermissionsToAnyFiles).toBeCalledWith(userId);
			expect(service.markFilesOwnedByUserForDeletion).toBeCalledWith(userId);
		});
	});
});
