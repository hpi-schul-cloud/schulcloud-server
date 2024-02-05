import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/mongodb';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections } from '@shared/testing';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { TldrawDrawing } from '../entities';
import { tldrawEntityFactory, tldrawTestConfig } from '../testing';
import { TldrawRepo } from '../repo/tldraw.repo';
import { TldrawService } from './tldraw.service';

describe('TldrawService', () => {
	let module: TestingModule;
	let service: TldrawService;
	let repo: TldrawRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] }),
				ConfigModule.forRoot(createConfigModuleOptions(tldrawTestConfig)),
			],
			providers: [TldrawService, TldrawRepo],
		}).compile();

		repo = module.get(TldrawRepo);
		service = module.get(TldrawService);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		jest.clearAllMocks();
	});

	describe('delete', () => {
		describe('when deleting all collection connected to one drawing', () => {
			it('should remove all collections giving drawing name', async () => {
				const drawing = tldrawEntityFactory.build();
				await repo.create(drawing);

				await service.deleteByDocName(drawing.docName);

				const result = await repo.findByDocName(drawing.docName);
				expect(result.length).toEqual(0);
			});
		});
	});
});
