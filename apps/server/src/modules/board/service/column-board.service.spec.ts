import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
	Card,
	ColumnBoard,
	ContentElementFactory,
	RichTextElement,
} from '@shared/domain/domainobject';
import { InputFormat } from '@shared/domain/types';
import { columnBoardNodeFactory, setupEntities } from '@shared/testing';
import { columnBoardFactory, columnFactory, richTextElementFactory } from '@shared/testing/factory/domainobject';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { ColumnBoardService } from './column-board.service';

describe(ColumnBoardService.name, () => {
	let module: TestingModule;
	let service: ColumnBoardService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;
	let contentElementFactory: DeepMocked<ContentElementFactory>;
	let configBefore: IConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnBoardService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: BoardDoService,
					useValue: createMock<BoardDoService>(),
				},
				{
					provide: ContentElementFactory,
					useValue: createMock<ContentElementFactory>(),
				},
			],
		}).compile();

		service = module.get(ColumnBoardService);
		boardDoRepo = module.get(BoardDoRepo);
		boardDoService = module.get(BoardDoService);
		contentElementFactory = module.get(ContentElementFactory);
		configBefore = Configuration.toObject({ plainSecrets: true });
		await setupEntities();
	});

	afterEach(() => {
		jest.clearAllMocks();
		Configuration.reset(configBefore);
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const board = columnBoardFactory.build();
		const boardId = board.id;
		const column = columnFactory.build();
		const externalReference: BoardExternalReference = {
			id: new ObjectId().toHexString(),
			type: BoardExternalReferenceType.Course,
		};

		return { board, boardId, column, externalReference };
	};

	describe('findById', () => {
		it('should call the board do repository', async () => {
			const { boardId, board } = setup();
			boardDoRepo.findByClassAndId.mockResolvedValueOnce(board);

			await service.findById(boardId);

			expect(boardDoRepo.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, boardId);
		});

		it('should return the columnBoard object of the given', async () => {
			const { board } = setup();
			boardDoRepo.findByClassAndId.mockResolvedValueOnce(board);

			const result = await service.findById(board.id);

			expect(result).toEqual(board);
		});
	});

	describe('findIdsByExternalReference', () => {
		it('should call the board do repository', async () => {
			const { boardId, externalReference } = setup();

			boardDoRepo.findIdsByExternalReference.mockResolvedValue([boardId]);

			await service.findIdsByExternalReference(externalReference);

			expect(boardDoRepo.findIdsByExternalReference).toHaveBeenCalledWith(externalReference);
		});
	});

	describe('findByDescendant', () => {
		describe('when searching a board for an element', () => {
			const setup2 = () => {
				const element = richTextElementFactory.build();
				const board: ColumnBoard = columnBoardFactory.build({ children: [element] });

				boardDoRepo.getAncestorIds.mockResolvedValue([board.id]);
				boardDoRepo.findById.mockResolvedValue(board);

				return {
					element,
					board,
				};
			};

			it('should search by the root id', async () => {
				const { element, board } = setup2();

				await service.findByDescendant(element);

				expect(boardDoRepo.findById).toHaveBeenCalledWith(board.id, 1);
			});

			it('should return the board', async () => {
				const { element, board } = setup2();

				const result = await service.findByDescendant(element);

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

			it('should search by the root id', async () => {
				const { board } = setup2();

				await service.findByDescendant(board);

				expect(boardDoRepo.findById).toHaveBeenCalledWith(board.id, 1);
			});

			it('should return the board', async () => {
				const { board } = setup2();

				const result = await service.findByDescendant(board);

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

				await expect(service.findByDescendant(element)).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});

	describe('getBoardObjectTitlesById', () => {
		describe('when asking for a list of boardObject-ids', () => {
			const setupBoards = () => {
				return {
					boardNodes: columnBoardNodeFactory.buildListWithId(3),
				};
			};

			it('should call the boardDoRepo.getTitleById with the same parameters', async () => {
				const { boardNodes } = setupBoards();
				const ids = boardNodes.map((n) => n.id);

				await service.getBoardObjectTitlesById(ids);

				expect(boardDoRepo.getTitlesByIds).toHaveBeenCalledWith(ids);
			});
		});
	});

	describe('create', () => {
		const setupBoards = () => {
			const context: BoardExternalReference = {
				type: BoardExternalReferenceType.Course,
				id: new ObjectId().toHexString(),
			};

			return { context };
		};

		describe('when creating a fresh column board', () => {
			it('should return a columnBoardInfo of that board', async () => {
				const { context } = setupBoards();
				const title = `My brand new Mainboard`;

				const columnBoardInfo = await service.create(context, title);

				expect(columnBoardInfo).toEqual(expect.objectContaining({ title }));
			});
		});
	});

	describe('delete', () => {
		it('should call the service to delete the board', async () => {
			const { board } = setup();

			await service.delete(board);

			expect(boardDoService.deleteWithDescendants).toHaveBeenCalledWith(board);
		});
	});

	describe('updateTitle', () => {
		describe('when updating the title', () => {
			it('should call the service', async () => {
				const board = columnBoardFactory.build();
				const newTitle = 'new title';

				await service.updateTitle(board, newTitle);

				expect(boardDoRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
						title: newTitle,
						children: [],
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					})
				);
			});
		});
	});

	describe('createWelcomeColumnBoard', () => {
		beforeEach(() => {
			contentElementFactory.build.mockImplementation(() => richTextElementFactory.build());
		});

		it('should create a column board with initial content', async () => {
			const { externalReference } = setup();

			const columnBoard = await service.createWelcomeColumnBoard(externalReference);

			const column = columnBoard.children[0];
			const card = column.children[0] as Card;
			const element = card.children[0] as RichTextElement;
			expect(card.title).not.toHaveLength(0);
			expect(element).toEqual(
				expect.objectContaining({
					text: expect.any(String),
					inputFormat: InputFormat.RICH_TEXT_CK5,
				})
			);
		});

		describe('when a help link is configured', () => {
			beforeEach(() => {
				Configuration.set('COLUMN_BOARD_HELP_LINK', 'http://example.com/help');
			});

			it('should add a text element containing the link url', async () => {
				const { externalReference } = setup();

				const columnBoard = await service.createWelcomeColumnBoard(externalReference);

				const column = columnBoard.children[0];
				const card = column.children[0] as Card;
				const element = card.children[1] as RichTextElement;

				expect(element.text).toEqual(expect.stringContaining(Configuration.get('COLUMN_BOARD_HELP_LINK') as string));
			});
		});

		describe('when a feedback link is configured', () => {
			beforeEach(() => {
				Configuration.set('COLUMN_BOARD_FEEDBACK_LINK', 'http://example.com/feedback');
			});

			it('should add a text element containing the link url', async () => {
				const { externalReference } = setup();

				const columnBoard = await service.createWelcomeColumnBoard(externalReference);

				const column = columnBoard.children[0];
				const card = column.children[0] as Card;
				const element = card.children[2] as RichTextElement;

				expect(element.text).toEqual(
					expect.stringContaining(Configuration.get('COLUMN_BOARD_FEEDBACK_LINK') as string)
				);
			});
		});

		describe('contact link text element', () => {
			it('should add a text element containing the link url when theme is not default', async () => {
				Configuration.set('SC_THEME', 'brb');
				const { externalReference } = setup();

				const clientUrl = Configuration.get('HOST') as string;
				const expectedContactUrl = `${clientUrl}/help/contact/`;

				const columnBoard = await service.createWelcomeColumnBoard(externalReference);

				const column = columnBoard.children[0];
				const card = column.children[0] as Card;
				const element = card.children.find((child) => (child as RichTextElement).text.includes(clientUrl));

				expect((element as RichTextElement).text).toEqual(expect.stringContaining(expectedContactUrl));
			});

			it('should not add a text element when theme is default', async () => {
				Configuration.set('SC_THEME', 'default');
				const { externalReference } = setup();

				const clientUrl = Configuration.get('HOST') as string;

				const columnBoard = await service.createWelcomeColumnBoard(externalReference);

				const column = columnBoard.children[0];
				const card = column.children[0] as Card;
				const element = card.children.find((child) => (child as RichTextElement).text.includes(clientUrl));

				expect(element).toBeUndefined();
			});
		});
	});
});
