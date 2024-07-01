import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { setupEntities } from '@shared/testing';
import { ColumnBoard, LinkElement } from '../../domain';
import { BoardNodeRepo } from '../../repo';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	linkElementFactory,
	richTextElementFactory,
} from '../../testing';
import { BoardNodeService } from '../board-node.service';
import { ColumnBoardLinkService } from './column-board-link.service';

describe(ColumnBoardLinkService.name, () => {
	let module: TestingModule;
	let service: ColumnBoardLinkService;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardNodeRepo: DeepMocked<BoardNodeRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnBoardLinkService,
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
			],
		}).compile();

		service = module.get(ColumnBoardLinkService);
		boardNodeService = module.get(BoardNodeService);
		boardNodeRepo = module.get(BoardNodeRepo);

		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('swap link ids', () => {
		const setup = () => {
			const oldId = new ObjectId().toHexString();
			const newId = new ObjectId().toHexString();
			const idMap = new Map<EntityId, EntityId>();
			idMap.set(oldId, newId);

			const elements = [
				richTextElementFactory.build(),
				linkElementFactory.build({ url: `https://example.com/${oldId}/article` }),
			];
			const card = cardFactory.build({ children: elements });
			const column = columnFactory.build({ children: [card] });
			const board = columnBoardFactory.build({ children: [column] });

			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

			return { board, linkElement: elements[1] as LinkElement, idMap, oldId, newId };
		};

		it('should find the board', async () => {
			const { board, idMap } = setup();

			await service.swapLinkedIds(board.id, idMap);

			expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, board.id);
		});

		describe('when board node is a link element', () => {
			it('should replace ids in urls', async () => {
				const { board, linkElement, idMap, newId } = setup();

				await service.swapLinkedIds(board.id, idMap);

				expect(linkElement.url).toBe(`https://example.com/${newId}/article`);
			});

			it('should save the board', async () => {
				const { board, idMap } = setup();

				await service.swapLinkedIds(board.id, idMap);

				expect(boardNodeRepo.save).toHaveBeenCalledWith(board);
			});
		});
	});
});
