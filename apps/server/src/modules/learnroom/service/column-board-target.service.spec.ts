import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnBoardTarget } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, columnBoardTargetFactory } from '@shared/testing';
import { ColumnBoardService } from '@src/modules/board';
import { ColumnBoardTargetService } from './column-board-target.service';

describe(ColumnBoardTargetService.name, () => {
	let module: TestingModule;
	let service: ColumnBoardTargetService;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				ColumnBoardTargetService,
				{ provide: ColumnBoardService, useValue: createMock<ColumnBoardService>() },
			],
		}).compile();
		service = module.get(ColumnBoardTargetService);
		columnBoardService = module.get(ColumnBoardService);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(ColumnBoardTarget, {});
	});

	describe('findOrCreateTargets', () => {
		describe('when target exists for columnBoardId', () => {
			const setup = async () => {
				const columnBoardId = new ObjectId().toHexString();
				const target = columnBoardTargetFactory.build({ columnBoardId, title: 'board #1' });
				await em.persistAndFlush(target);

				return { target };
			};

			it('should return the target', async () => {
				const { target } = await setup();

				const result = await service.findOrCreateTargets([target.columnBoardId]);

				expect(result).toEqual([target]);
			});

			it('should update the target name', async () => {
				const { target } = await setup();
				columnBoardService.getBoardObjectTitlesById.mockResolvedValueOnce({ [target.columnBoardId]: 'board #42' });

				const result = await service.findOrCreateTargets([target.columnBoardId]);

				expect(result[0].title).toEqual('board #42');
			});
		});
	});
});
