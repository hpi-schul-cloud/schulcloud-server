import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { columnFactory } from '@shared/testing/factory/domainobject';
import { BoardDoRepo } from '../repo';
import { BoardNodeService } from './board-node.service';

describe(BoardNodeService.name, () => {
	let module: TestingModule;
	let service: BoardNodeService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardNodeService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
			],
		}).compile();

		service = module.get(BoardNodeService);
		boardDoRepo = module.get(BoardDoRepo);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findById', () => {
		describe('when finding a node element', () => {
			const setup = () => {
				const column = columnFactory.build();
				return { column, columnId: column.id };
			};

			it('should call the repository', async () => {
				const { column, columnId } = setup();
				boardDoRepo.findById.mockResolvedValueOnce(column);

				await service.findById(columnId);

				expect(boardDoRepo.findById).toHaveBeenCalledWith(columnId);
			});

			it('should return the column', async () => {
				const { column, columnId } = setup();
				boardDoRepo.findById.mockResolvedValueOnce(column);

				const result = await service.findById(columnId);

				expect(result).toEqual(column);
			});
		});
	});
});
