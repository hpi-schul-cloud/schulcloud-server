import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { NotFoundException } from '@nestjs/common';
import { tldrawEntityFactory, tldrawTestConfig } from '../testing';
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
			imports: [TldrawWsTestModule, ConfigModule.forRoot(createConfigModuleOptions(tldrawTestConfig))],
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
			const setup = async () => {
				const drawing = tldrawEntityFactory.build();

				await repo.create(drawing);
				em.clear();

				return {
					drawing,
				};
			};

			it('should create new drawing node', async () => {
				const { drawing } = await setup();

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
			const setup = async () => {
				const drawing = tldrawEntityFactory.build();

				await repo.create(drawing);

				return {
					drawing,
				};
			};

			it('should delete all records', async () => {
				const { drawing } = await setup();

				const results = await repo.findByDocName(drawing.docName);
				await repo.delete(results);

				expect(results.length).not.toEqual(0);
				await expect(repo.findByDocName(drawing.docName)).rejects.toThrow(NotFoundException);
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
