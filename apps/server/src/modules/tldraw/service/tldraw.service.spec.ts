import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/mongodb';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections } from '@shared/testing';
import { NotFoundException } from '@nestjs/common';
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
				const result = await repo.findByDocName(drawing.docName);

				expect(result.length).toEqual(1);

				await service.deleteByDocName(drawing.docName);

				await expect(repo.findByDocName(drawing.docName)).rejects.toThrow(NotFoundException);
			});

			it('should throw when cannot find drawing', async () => {
				await expect(service.deleteByDocName('nonExistingName')).rejects.toThrow(NotFoundException);
			});
		});
	});
});
