import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { type EntityId } from '@shared/domain/types';
import { type LinkElement } from '../../domain';
import { BoardNodeRepo } from '../../repo';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	linkElementFactory,
	richTextElementFactory,
} from '../../testing';
import { ColumnBoardLinkService } from './column-board-link.service';

describe(ColumnBoardLinkService.name, () => {
	let module: TestingModule;
	let service: ColumnBoardLinkService;
	let boardNodeRepo: DeepMocked<BoardNodeRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnBoardLinkService,
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
			],
		}).compile();

		service = module.get(ColumnBoardLinkService);
		boardNodeRepo = module.get(BoardNodeRepo);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('swapLinkedIdsInBoardNode', () => {
		describe('when called with a board containing link elements', () => {
			const setup = () => {
				const oldId = new ObjectId().toHexString();
				const newId = new ObjectId().toHexString();
				const idMap = new Map<EntityId, EntityId>();
				idMap.set(oldId, newId);

				const linkElement = linkElementFactory.build({ url: `https://example.com/${oldId}/article` });
				const elements = [richTextElementFactory.build(), linkElement];
				const card = cardFactory.build({ children: elements });
				const column = columnFactory.build({ children: [card] });
				const board = columnBoardFactory.build({ children: [column] });

				return { board, linkElement, idMap, newId };
			};

			it('should replace ids in link element urls', async () => {
				const { board, linkElement, idMap, newId } = setup();

				await service.swapLinkedIdsInBoardNode(board, idMap);

				expect(linkElement.url).toBe(`https://example.com/${newId}/article`);
			});

			it('should save the board', async () => {
				const { board, idMap } = setup();

				await service.swapLinkedIdsInBoardNode(board, idMap);

				expect(boardNodeRepo.save).toHaveBeenCalledTimes(1);
				expect(boardNodeRepo.save).toHaveBeenCalledWith(board);
			});
		});

		describe('when called with a column containing link elements', () => {
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

				return { column, linkElement: elements[1] as LinkElement, idMap, newId };
			};

			it('should replace ids in link element urls', async () => {
				const { column, linkElement, idMap, newId } = setup();

				await service.swapLinkedIdsInBoardNode(column, idMap);

				expect(linkElement.url).toBe(`https://example.com/${newId}/article`);
			});

			it('should save the node', async () => {
				const { column, idMap } = setup();

				await service.swapLinkedIdsInBoardNode(column, idMap);

				expect(boardNodeRepo.save).toHaveBeenCalledWith(column);
			});
		});
	});
});
