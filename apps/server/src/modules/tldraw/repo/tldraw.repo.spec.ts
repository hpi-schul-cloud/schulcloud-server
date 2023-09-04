import { createMock } from '@golevelup/ts-jest';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { CardNode } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { tldrawEntityFactory } from '@src/modules/tldraw/factory';
import { TldrawRepo } from './tldraw.repo';

describe(TldrawRepo.name, () => {
	let module: TestingModule;
	let repo: TldrawRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				TldrawRepo,
				{ provide: FilesStorageClientAdapterService, useValue: createMock<FilesStorageClientAdapterService>() },
			],
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

				const result = await em.find(CardNode, { _id: drawing._id });
				expect(result.map((n) => n.id).sort()).toEqual(drawing._id);
			});

			it('should flush the changes', async () => {
				const drawing = tldrawEntityFactory.build();
				jest.spyOn(em, 'flush');

				await repo.create(drawing);

				expect(em.flush).toHaveBeenCalled();
			});
		});
	});

	describe('findByDrawingName', () => {
		describe('when finding by drawingName', () => {
			const setup = async () => {
				const drawing = tldrawEntityFactory.build();
				await em.persistAndFlush(drawing);
				em.clear();

				return { drawing };
			};

			it('should return the object', async () => {
				const { drawing } = await setup();
				const result = await repo.findByDrawingName(drawing.docName);
				expect(result[0].docName).toEqual(drawing.docName);
			});

			it('should throw an error when not found', async () => {
				await expect(repo.findByDrawingName('invalid-name')).rejects.toThrowError(NotFoundError);
			});
		});
	});

	describe('delete', () => {
		describe('when finding by docName and deleting all records', () => {
			it('should delete all records', async () => {
				const drawing = tldrawEntityFactory.build();
				await repo.create(drawing);

				const results = await repo.findByDrawingName(drawing.docName);
				await repo.delete(results);

				const emptyResults = await repo.findByDrawingName(drawing.docName);
				expect(emptyResults.length).toEqual(0);
			});
		});
	});
});
