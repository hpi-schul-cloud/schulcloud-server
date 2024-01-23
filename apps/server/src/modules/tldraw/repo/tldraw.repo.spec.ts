import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { NotFoundException } from '@nestjs/common';
import { tldrawEntityFactory } from '../factory';
import { TldrawDrawing } from '../entities';
import { TldrawRepo } from './tldraw.repo';

describe(TldrawRepo.name, () => {
	let module: TestingModule;
	let repo: TldrawRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] })],
			providers: [TldrawRepo],
		}).compile();
		repo = module.get(TldrawRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('create', () => {
		describe('when called', () => {
			it('should create new drawing node', async () => {
				const drawing = tldrawEntityFactory.build();

				await repo.create(drawing);
				em.clear();

				const result = await em.find(TldrawDrawing, {});
				expect(result[0]._id).toEqual(drawing._id);
			});

			it('should flush the changes', async () => {
				const drawing = tldrawEntityFactory.build();
				jest.spyOn(em, 'flush');

				await repo.create(drawing);

				expect(em.flush).toHaveBeenCalled();
			});
		});
	});

	describe('findByDocName', () => {
		describe('when finding by docName', () => {
			const setup = async () => {
				const drawing = tldrawEntityFactory.build();
				await em.persistAndFlush(drawing);
				em.clear();

				return { drawing };
			};

			it('should return the object', async () => {
				const { drawing } = await setup();
				const result = await repo.findByDocName(drawing.docName);
				expect(result[0].docName).toEqual(drawing.docName);
				expect(result[0]._id).toEqual(drawing._id);
			});

			it('should throw NotFoundException for wrong docName', async () => {
				await expect(repo.findByDocName('invalid-name')).rejects.toThrow(NotFoundException);
			});
		});
	});

	describe('delete', () => {
		describe('when finding by docName and deleting all records', () => {
			it('should delete all records', async () => {
				const drawing = tldrawEntityFactory.build();
				await repo.create(drawing);

				const results = await repo.findByDocName(drawing.docName);
				await repo.delete(results);

				expect(results.length).not.toEqual(0);
				await expect(repo.findByDocName(drawing.docName)).rejects.toThrow(NotFoundException);
			});
		});
	});
});
