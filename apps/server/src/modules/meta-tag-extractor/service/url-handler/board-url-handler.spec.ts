import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType, BoardNodeService, ColumnBoard } from '@modules/board';
import { cardFactory, columnBoardFactory } from '@modules/board/testing';
import { CourseDoService } from '@modules/course';
import { courseFactory } from '@modules/course/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MetaData, MetaDataEntityType } from '../../types';
import { BoardUrlHandler } from './board-url-handler';

describe(BoardUrlHandler.name, () => {
	let module: TestingModule;
	let boardUrlHandler: BoardUrlHandler;

	let boardNodeService: DeepMocked<BoardNodeService>;
	let courseService: DeepMocked<CourseDoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardUrlHandler,
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: CourseDoService,
					useValue: createMock<CourseDoService>(),
				},
			],
		}).compile();

		boardUrlHandler = module.get(BoardUrlHandler);
		boardNodeService = module.get(BoardNodeService);
		courseService = module.get(CourseDoService);
	});

	describe('getMetaData', () => {
		describe('when the url fits a board', () => {
			const setup = () => {
				const course = courseFactory.build();
				const board = columnBoardFactory.build({
					title: 'My Board',
					context: { type: BoardExternalReferenceType.Course, id: course.id },
				});
				const url = new URL(`https://localhost/boards/${board.id}`);

				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);
				courseService.findById.mockResolvedValueOnce(course);

				return {
					board,
					course,
					url,
				};
			};

			it('should call courseService with the correct id', async () => {
				const { board, url } = setup();

				await boardUrlHandler.getMetaData(url);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, board.id);
			});

			it('should take the title from the board name', async () => {
				const { board, course, url } = setup();

				const result = await boardUrlHandler.getMetaData(url);

				expect(result).toEqual<MetaData>({
					url: url.toString(),
					description: '',
					title: board.title,
					type: MetaDataEntityType.BOARD,
					parentType: MetaDataEntityType.COURSE,
					parentTitle: course.name,
				});
			});
		});

		describe('when the url has a hash to a card with a title', () => {
			const setup = () => {
				const board = columnBoardFactory.build({
					title: 'My Board',
					context: { type: BoardExternalReferenceType.User, id: new ObjectId().toHexString() },
				});
				const cardTitle = 'My Card';
				const card = cardFactory.build({
					title: cardTitle,
				});
				const url = new URL(`https://localhost/boards/${board.id}#card-${card.id}`);

				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				return {
					board,
					card,
					cardTitle,
					url,
				};
			};

			it('should use the title from the board card', async () => {
				const { cardTitle, url } = setup();

				const result = await boardUrlHandler.getMetaData(url);

				expect(result).toEqual<MetaData>({
					url: url.toString(),
					description: '',
					title: cardTitle,
					type: MetaDataEntityType.BOARD_CARD,
				});
			});
		});

		describe('when the url has a hash to a card without a title', () => {
			const setup = () => {
				const board = columnBoardFactory.build({
					title: 'My Board',
					context: { type: BoardExternalReferenceType.User, id: new ObjectId().toHexString() },
				});
				const card = cardFactory.build({
					title: undefined,
				});
				const url = new URL(`https://localhost/boards/${board.id}#card-${card.id}`);

				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(card);

				return {
					board,
					card,
					url,
				};
			};

			it('should use "-" as the title', async () => {
				const { url } = setup();

				const result = await boardUrlHandler.getMetaData(url);

				expect(result).toEqual<MetaData>({
					url: url.toString(),
					description: '',
					title: '-',
					type: MetaDataEntityType.BOARD_CARD,
				});
			});
		});

		describe('when the url has an invalid hash', () => {
			const setup = () => {
				const board = columnBoardFactory.build({
					title: 'My Board',
					context: { type: BoardExternalReferenceType.User, id: new ObjectId().toHexString() },
				});
				const url = new URL(`https://localhost/boards/${board.id}#invalid-hash`);

				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				return {
					board,
					url,
				};
			};

			it('should take the title from the board', async () => {
				const { board, url } = setup();

				const result = await boardUrlHandler.getMetaData(url);

				expect(result).toEqual<MetaData>({
					url: url.toString(),
					description: '',
					title: board.title,
					type: MetaDataEntityType.BOARD,
				});
			});
		});

		describe('when the url has a hash with an invalid link type ', () => {
			const setup = () => {
				const board = columnBoardFactory.build({
					title: 'My Board',
					context: { type: BoardExternalReferenceType.User, id: new ObjectId().toHexString() },
				});
				const url = new URL(`https://localhost/boards/${board.id}#invalid-${new ObjectId().toHexString()}`);

				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				return {
					board,
					url,
				};
			};

			it('should take the title from the board', async () => {
				const { board, url } = setup();

				const result = await boardUrlHandler.getMetaData(url);

				expect(result).toEqual<MetaData>({
					url: url.toString(),
					description: '',
					title: board.title,
					type: MetaDataEntityType.BOARD,
				});
			});
		});

		describe('when path in url does not fit', () => {
			it('should return undefined', async () => {
				const url = new URL(`https://localhost/invalid/671a5bdf0995ace8cbc6f899`);

				const result = await boardUrlHandler.getMetaData(url);

				expect(result).toBeUndefined();
			});
		});

		describe('when mongoId in url is invalid', () => {
			it('should return undefined', async () => {
				const url = new URL(`https://localhost/boards/ef2345abe4e3b`);

				const result = await boardUrlHandler.getMetaData(url);

				expect(result).toBeUndefined();
			});
		});
	});
});
