import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportUser } from '@shared/domain/entity';
import { ImportUserRepo } from '@shared/repo';
import { cleanupCollections, importUserFactory } from '@shared/testing';
import { UserImportService } from './user-import.service';

describe(UserImportService.name, () => {
	let module: TestingModule;
	let service: UserImportService;
	let em: EntityManager;

	let userImportRepo: ImportUserRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				UserImportService,
				{
					provide: ImportUserRepo,
					useValue: createMock<ImportUserRepo>(),
				},
			],
		}).compile();

		service = module.get(UserImportService);
		em = module.get(EntityManager);
		userImportRepo = module.get(ImportUserRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('saveImportUsers', () => {
		const setup = () => {
			const importUser: ImportUser = importUserFactory.build();
			const otherImportUser: ImportUser = importUserFactory.build();

			return {
				importUsers: [importUser, otherImportUser],
			};
		};

		it('should call saveImportUsers', async () => {
			const { importUsers } = setup();

			await service.saveImportUsers(importUsers);

			expect(userImportRepo.saveImportUsers).toHaveBeenCalledWith(importUsers);
		});
	});
});
