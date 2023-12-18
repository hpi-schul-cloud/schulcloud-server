import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { tldrawEntityFactory } from '../testing';
import { TldrawDrawing } from '../entities';
import { TldrawRepo } from './tldraw.repo';
import { TldrawWsTestModule } from '..';

describe('TldrawRepo', () => {
	let testingModule: TestingModule;
	let repo: TldrawRepo;
	let em: EntityManager;
	let orm: MikroORM;

	beforeAll(async () => {
		testingModule = await Test.createTestingModule({
			imports: [TldrawWsTestModule],
		}).compile();

		repo = testingModule.get(TldrawRepo);
		em = testingModule.get(EntityManager);
		orm = testingModule.get(MikroORM);
	});

	afterAll(async () => {
		await testingModule.close();
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

			it('should not find any record giving wrong docName', async () => {
				const result = await repo.findByDocName('invalid-name');

				expect(result.length).toEqual(0);
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
				const emptyResults = await repo.findByDocName(drawing.docName);

				expect(emptyResults.length).toEqual(0);
			});
		});
	});

	describe('ensureIndexes', () => {
		it('should call getSchemaGenerator().ensureIndexes()', async () => {
			const ormSpy = jest.spyOn(orm, 'getSchemaGenerator');

			await repo.ensureIndexes();

			expect(ormSpy).toHaveBeenCalled();
		});
	});
});
