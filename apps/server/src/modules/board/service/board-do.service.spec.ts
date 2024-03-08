import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	richTextElementFactory,
} from '@shared/testing/factory/domainobject';
import { ColumnBoard } from '@shared/domain/domainobject';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

describe(BoardDoService.name, () => {
	let module: TestingModule;
	let service: BoardDoService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardDoService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
			],
		}).compile();

		service = module.get(BoardDoService);
		boardDoRepo = module.get(BoardDoRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('move', () => {
		describe('when moving a card from one column to another', () => {
			const setup = () => {
				const sourceCards = cardFactory.buildList(3);
				const sourceColumn = columnFactory.build({ children: sourceCards });

				const targetCards = cardFactory.buildList(2);
				const targetColumn = columnFactory.build({ children: targetCards });

				return { sourceColumn, targetColumn, sourceCards, targetCards };
			};

			it('should remove it from the source column', async () => {
				const { sourceCards, sourceColumn, targetColumn } = setup();
				const card = sourceCards[0];
				boardDoRepo.findParentOfId.mockResolvedValueOnce(sourceColumn);
				jest.spyOn(sourceColumn, 'removeChild');

				await service.move(card, targetColumn, 0);

				expect(sourceColumn.removeChild).toBeCalledWith(card);
			});

			it('should add it to the target column at specified position', async () => {
				const { sourceCards, sourceColumn, targetColumn } = setup();
				const card = sourceCards[0];
				boardDoRepo.findParentOfId.mockResolvedValueOnce(sourceColumn);
				jest.spyOn(targetColumn, 'addChild');

				await service.move(card, targetColumn, 1);

				expect(targetColumn.addChild).toBeCalledWith(card, 1);
			});
		});

		describe('when moving a card within the same column', () => {
			const setup = () => {
				const cards = cardFactory.buildList(3);
				const column = columnFactory.build({ children: cards });
				boardDoRepo.findParentOfId.mockResolvedValueOnce(column);

				return { column, cards };
			};

			it('should remove it from the column', async () => {
				const { cards, column } = setup();
				const card = cards[0];
				jest.spyOn(column, 'removeChild');

				await service.move(card, column, 2);

				expect(column.removeChild).toBeCalledWith(card);
			});

			it('should add it to the column at specified position', async () => {
				const { cards, column } = setup();
				const card = cards[0];
				jest.spyOn(column, 'addChild');

				await service.move(card, column, 1);

				expect(column.addChild).toBeCalledWith(card, 1);
			});
		});

		describe('when repo does not return the same DO instance', () => {
			describe('when moving a card within the same column', () => {
				// Note: We don not have (yet) an identity map for our domain objects.
				// That's why each call to the repo finders yields a new instance!
				// This test is for that situation and can be removed later.
				const setup = () => {
					const cards = cardFactory.buildList(3);
					const column = columnFactory.build({ children: cards });
					const columnClone = columnFactory.build({ id: column.id, children: column.children });
					boardDoRepo.findParentOfId.mockResolvedValueOnce(columnClone);

					return { column, cards, columnClone };
				};

				it('should remove it from the column', async () => {
					const { cards, column } = setup();
					const card = cards[0];
					jest.spyOn(column, 'removeChild');

					await service.move(card, column, 2);

					expect(column.removeChild).toBeCalledWith(card);
				});

				it('should add it to the column at specified position', async () => {
					const { cards, column } = setup();
					const card = cards[0];
					jest.spyOn(column, 'addChild');

					await service.move(card, column, 1);

					expect(column.addChild).toBeCalledWith(card, 1);
				});
			});
		});

		describe('when moving a root card to a column', () => {
			const setup = () => {
				const card = cardFactory.build();
				const targetColumn = columnFactory.build();
				boardDoRepo.findParentOfId.mockResolvedValueOnce(undefined);

				return { card, targetColumn };
			};

			it('should add it to the column at specified position', async () => {
				const { card, targetColumn } = setup();
				jest.spyOn(targetColumn, 'addChild');

				await service.move(card, targetColumn, 0);

				expect(targetColumn.addChild).toBeCalledWith(card, 0);
			});
		});
	});

	describe('deleteWithDescendants', () => {
		describe('when deleting an element', () => {
			const setup = () => {
				const elements = richTextElementFactory.buildList(3);
				const card = cardFactory.build({ children: elements });
				boardDoRepo.findParentOfId.mockResolvedValueOnce(card);

				return { card, elements };
			};

			it('should remove the element from the parent', async () => {
				const { elements, card } = setup();
				const element = elements[0];
				jest.spyOn(card, 'removeChild');

				await service.deleteWithDescendants(element);

				expect(card.removeChild).toHaveBeenCalledWith(element);
			});

			it('should update the siblings', async () => {
				const { elements, card } = setup();
				const element = elements[0];
				jest.spyOn(card, 'removeChild');
				const expectedElements = [elements[1], elements[2]];

				await service.deleteWithDescendants(element);

				expect(boardDoRepo.save).toHaveBeenCalledWith(expectedElements, card);
			});
		});
	});

	describe('getRootBoardDo', () => {
		describe('when searching a board for an element', () => {
			const setup2 = () => {
				const element = richTextElementFactory.build();
				const board = columnBoardFactory.build({ children: [element] });

				boardDoRepo.getAncestorIds.mockResolvedValue([board.id]);
				boardDoRepo.findById.mockResolvedValue(board);

				return {
					element,
					board,
				};
			};

			it('should return the board', async () => {
				const { element, board } = setup2();

				const result = await service.getRootBoardDo(element);

				expect(result).toEqual(board);
			});
		});

		describe('when searching a board by itself', () => {
			const setup2 = () => {
				const board: ColumnBoard = columnBoardFactory.build({ children: [] });

				boardDoRepo.getAncestorIds.mockResolvedValue([]);
				boardDoRepo.findById.mockResolvedValue(board);

				return {
					board,
				};
			};

			it('should return the board', async () => {
				const { board } = setup2();

				const result = await service.getRootBoardDo(board);

				expect(result).toEqual(board);
			});
		});

		describe('when the root node is not a board', () => {
			const setup2 = () => {
				const element = richTextElementFactory.build();

				boardDoRepo.getAncestorIds.mockResolvedValue([]);
				boardDoRepo.findById.mockResolvedValue(element);

				return {
					element,
				};
			};

			it('should throw a NotFoundLoggableException', async () => {
				const { element } = setup2();

				await expect(service.getRootBoardDo(element)).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});
});
