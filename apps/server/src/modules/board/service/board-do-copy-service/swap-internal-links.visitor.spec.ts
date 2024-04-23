import { ObjectId } from '@mikro-orm/mongodb';
import { LinkElement, MediaBoard, MediaExternalToolElement, MediaLine } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import {
	cardFactory,
	collaborativeTextEditorElementFactory,
	columnBoardFactory,
	columnFactory,
	drawingElementFactory,
	externalToolElementFactory,
	fileElementFactory,
	linkElementFactory,
	mediaBoardFactory,
	mediaExternalToolElementFactory,
	mediaLineFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '@shared/testing';
import { SwapInternalLinksVisitor } from './swap-internal-links.visitor';

describe('swap internal links visitor', () => {
	it('should keep link unchanged', () => {
		const map = new Map<EntityId, EntityId>();
		const linkElement = linkElementFactory.build({ url: 'testurl.dev' });
		const visitor = new SwapInternalLinksVisitor(map);

		linkElement.accept(visitor);

		expect(linkElement.url).toEqual('testurl.dev');
	});

	const setupIdPair = () => {
		const originalId = new ObjectId().toString();
		const newId = new ObjectId().toString();
		const value = {
			originalId,
			newId,
			originalUrl: `testurl.dev/${originalId}`,
			expectedUrl: `testurl.dev/${newId}`,
		};
		return value;
	};

	const buildIdMap = (pairs: { originalId: string; newId: string }[]) => {
		const map = new Map<EntityId, EntityId>();
		pairs.forEach((pair) => {
			map.set(pair.originalId, pair.newId);
		});
		return map;
	};

	const buildBoardContaining = (linkelelements: LinkElement[]) => {
		const cardContainingLinks = cardFactory.build({ children: linkelelements });
		const submissionContainer = submissionContainerElementFactory.build({
			children: [
				submissionItemFactory.build({
					children: [richTextElementFactory.build()],
				}),
			],
		});
		const cardContainingOthers = cardFactory.build({
			children: [
				richTextElementFactory.build(),
				fileElementFactory.build(),
				submissionContainer,
				drawingElementFactory.build(),
				externalToolElementFactory.build(),
				collaborativeTextEditorElementFactory.build(),
			],
		});
		const column = columnFactory.build({
			children: [cardContainingLinks, cardContainingOthers],
		});
		const columnBoard = columnBoardFactory.build({
			children: [column],
		});
		return columnBoard;
	};

	describe('when a single id is matched', () => {
		const setupWithIdPair = () => {
			const pair = setupIdPair();
			const map = buildIdMap([pair]);
			const visitor = new SwapInternalLinksVisitor(map);

			return { pair, visitor };
		};

		it('should change ids in link', () => {
			const { pair, visitor } = setupWithIdPair();
			const linkElement = linkElementFactory.build({ url: pair.originalUrl });

			linkElement.accept(visitor);

			expect(linkElement.url).toEqual(pair.expectedUrl);
		});

		it('should change ids in multiple matching links', () => {
			const { pair, visitor } = setupWithIdPair();
			const firstLinkElement = linkElementFactory.build({ url: pair.originalUrl });
			const secondLinkElement = linkElementFactory.build({ url: pair.originalUrl });
			const root = buildBoardContaining([firstLinkElement, secondLinkElement]);

			root.accept(visitor);

			expect(firstLinkElement.url).toEqual(pair.expectedUrl);
			expect(secondLinkElement.url).toEqual(pair.expectedUrl);
		});
	});

	describe('when multiple different ids are matched', () => {
		const setupWithMultipleIds = () => {
			const pairs = [setupIdPair(), setupIdPair()];

			const idMap = buildIdMap(pairs);
			const visitor = new SwapInternalLinksVisitor(idMap);

			return { visitor, pairs };
		};

		const buildLinkElementsWithUrls = (urls: string[]) => urls.map((url) => linkElementFactory.build({ url }));

		it('should change multiple ids in different links', () => {
			const { visitor, pairs } = setupWithMultipleIds();
			const linkElements = buildLinkElementsWithUrls(pairs.map((pair) => pair.originalUrl));
			const root = buildBoardContaining(linkElements);

			root.accept(visitor);

			expect(linkElements[0].url).toEqual(pairs[0].expectedUrl);
			expect(linkElements[1].url).toEqual(pairs[1].expectedUrl);
		});
	});

	describe('when it is a media board', () => {
		const setup = () => {
			const element = mediaExternalToolElementFactory.build();
			const elementCopy = new MediaExternalToolElement(element.getProps());
			const line = mediaLineFactory.build({ children: [element] });
			const lineCopy = new MediaLine(line.getProps());
			const board = mediaBoardFactory.build({ children: [line] });
			const boardCopy = new MediaBoard(board.getProps());

			const visitor = new SwapInternalLinksVisitor(new Map());

			return {
				element,
				elementCopy,
				line,
				lineCopy,
				board,
				boardCopy,
				visitor,
			};
		};

		it('should do nothing', () => {
			const { visitor, element, elementCopy, line, lineCopy, board, boardCopy } = setup();

			visitor.visitMediaBoard(board);

			expect(element).toEqual(elementCopy);
			expect(line).toEqual(lineCopy);
			expect(board).toEqual(boardCopy);
		});
	});
});
