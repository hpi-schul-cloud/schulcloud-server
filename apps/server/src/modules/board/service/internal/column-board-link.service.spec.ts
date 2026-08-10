import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
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

	describe('rewriteLinkUrlsInBoardNode', () => {
		describe('when called with a board containing link elements', () => {
			const setup = () => {
				const oldId = new ObjectId().toHexString();
				const newId = new ObjectId().toHexString();
				const idMap = { [oldId]: newId };

				const linkElement = linkElementFactory.build({ url: `https://example.com/${oldId}/article` });
				const elements = [richTextElementFactory.build(), linkElement];
				const card = cardFactory.build({ children: elements });
				const column = columnFactory.build({ children: [card] });
				const board = columnBoardFactory.build({ children: [column] });

				return { board, linkElement, idMap, newId };
			};

			it('should replace ids in link element urls', async () => {
				const { board, linkElement, idMap, newId } = setup();

				await service.rewriteLinkUrlsInBoardNode(board, idMap);

				expect(linkElement.url).toBe(`https://example.com/${newId}/article`);
			});

			it('should save the board', async () => {
				const { board, idMap } = setup();

				await service.rewriteLinkUrlsInBoardNode(board, idMap);

				expect(boardNodeRepo.save).toHaveBeenCalledTimes(1);
				expect(boardNodeRepo.save).toHaveBeenCalledWith(board);
			});
		});

		describe('when called with a column containing link elements', () => {
			const setup = () => {
				const oldId = new ObjectId().toHexString();
				const newId = new ObjectId().toHexString();
				const idMap = { [oldId]: newId };

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

				await service.rewriteLinkUrlsInBoardNode(column, idMap);

				expect(linkElement.url).toBe(`https://example.com/${newId}/article`);
			});

			it('should save the node', async () => {
				const { column, idMap } = setup();

				await service.rewriteLinkUrlsInBoardNode(column, idMap);

				expect(boardNodeRepo.save).toHaveBeenCalledWith(column);
			});
		});

		describe('when having card-links in the replacement-map', () => {
			const createCardLinkUrlPart = (boardId: string, cardId: string) => `boards/${boardId}#card-${cardId}`;
			const setup = () => {
				const sourceBoardId = new ObjectId().toHexString();
				const targetBoardId = new ObjectId().toHexString();
				const sourceCardId = new ObjectId().toHexString();
				const copiedCardId = new ObjectId().toHexString();
				const otherCardId = new ObjectId().toHexString();

				const linkElement1 = linkElementFactory.build({
					url: createCardLinkUrlPart(sourceBoardId, sourceCardId),
					title: 'Link to card that gets copied',
				});
				const linkElement2 = linkElementFactory.build({
					url: createCardLinkUrlPart(sourceBoardId, otherCardId),
					title: 'Link to card that does not get copied',
				});
				const elements = [richTextElementFactory.build(), linkElement1, linkElement2];
				const card = cardFactory.build({ id: sourceCardId, children: elements });
				const column = columnFactory.build({ children: [card] });
				const board = columnBoardFactory.build({ id: sourceBoardId, children: [column] });

				return { board, column, linkElement1, linkElement2, sourceCardId, copiedCardId, targetBoardId };
			};

			describe('when partial part-link is given', () => {
				it('should replace parts of urls', async () => {
					const { board, linkElement1, linkElement2, copiedCardId, targetBoardId } = setup();

					const copiedUrl = createCardLinkUrlPart(targetBoardId, copiedCardId);
					const linkElement2UrlBefore = linkElement2.url;

					await service.rewriteLinkUrlsInBoardNode(board, {
						[linkElement1.url]: copiedUrl,
					});

					expect(linkElement1.url).toBe(createCardLinkUrlPart(targetBoardId, copiedCardId));
					expect(linkElement2.url).toBe(linkElement2UrlBefore); // should not be changed
				});
			});

			describe('when id-map is given for boardid', () => {
				it('should replace parts of urls', async () => {
					const { board, linkElement1, linkElement2, targetBoardId } = setup();

					await service.rewriteLinkUrlsInBoardNode(board, {
						[board.id]: targetBoardId,
					});

					expect(linkElement1.url).toContain(targetBoardId);
					expect(linkElement2.url).toContain(targetBoardId);
				});
			});

			describe('when id-map is given for boardid and one card.id', () => {
				it('should replace parts of urls', async () => {
					const { board, linkElement1, linkElement2, targetBoardId, sourceCardId, copiedCardId } = setup();

					await service.rewriteLinkUrlsInBoardNode(board, {
						[board.id]: targetBoardId,
						[sourceCardId]: copiedCardId,
					});

					expect(linkElement1.url).toContain(targetBoardId);
					expect(linkElement2.url).toContain(targetBoardId);
					expect(linkElement1.url).toContain(copiedCardId);
					expect(linkElement2.url).not.toContain(copiedCardId);
				});
			});
		});
	});
});
