import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/mongodb';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { TldrawDrawing } from '../entities';
import { tldrawEntityFactory } from '../factory';
import { TldrawRepo } from '../repo/tldraw.repo';
import { TldrawService } from './tldraw.service';

describe(TldrawService.name, () => {
	let module: TestingModule;
	let service: TldrawService;
	let repo: TldrawRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] })],
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
		jest.resetAllMocks();
	});

	describe('delete', () => {
		describe('when deleting all collection connected to one drawing', () => {
			it('should remove all collections giving drawing name', async () => {
				const drawing = tldrawEntityFactory.build();

				await repo.create(drawing);
				const result = await repo.findByDrawingName(drawing.docName);

				expect(result.length).toEqual(1);

				await service.deleteByDrawingName(drawing.docName);
				const emptyResult = await repo.findByDrawingName(drawing.docName);

				expect(emptyResult.length).toEqual(0);
			});
		});
	});
});
