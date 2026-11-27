import {
	BoardImportJobLogReason,
	BoardImportJobRejectedError,
	type BoardImportSource,
	type IntermediateElement,
	IntermediateElementType,
} from '@modules/board-import';
import { BOARD_IMPORT_TASKCARDS_SOURCE_TYPE } from '../../board-import-taskcards.constants';
import { readTaskcardsFixture } from '../../testing';
import {
	mapTaskcardsBoard,
	TASKCARDS_NOT_SUPPORTED_KIND_CONTACT,
	TASKCARDS_SECTION_TITLE_FOR_CARDS_WITHOUT_LIST,
} from './board-import-taskcards-board';
import { isJsonObject, type JsonObject } from './taskcards-json';

describe('mapTaskcardsBoard', () => {
	const source: BoardImportSource = {
		type: BOARD_IMPORT_TASKCARDS_SOURCE_TYPE,
		link: 'https://www.taskcards.de/#/board/793bed21-a8ac-4a26-910e-2c3305ac6c0d',
	};

	const file = (name: string, mimeType: string, sizeInBytes: number, id: string): IntermediateElement => {
		const url = `https://taskcards.s3.hidrive.strato.com/attachments/${id}`;

		return { type: IntermediateElementType.FILE, name, url, mimeType, sizeInBytes };
	};

	const text = (html: string): IntermediateElement => {
		return { type: IntermediateElementType.TEXT, html };
	};

	const readBoardFixture = (): JsonObject => {
		const answer: unknown = JSON.parse(readTaskcardsFixture('board-pinboard.json'));
		const data = isJsonObject(answer) ? answer.data : undefined;
		const board = isJsonObject(data) ? data.board : undefined;
		if (!isJsonObject(board)) {
			throw new Error('The fixture contains no board');
		}

		return board;
	};

	const findDescription = (board: JsonObject, title: string): string => {
		const cards: unknown[] = Array.isArray(board.cards) ? board.cards : [];
		const description = cards.filter(isJsonObject).find((item) => item.title === title)?.description;
		if (typeof description !== 'string') {
			throw new Error('The fixture contains no card with this title');
		}

		return description;
	};

	describe('when the board is the pinboard of the test boards', () => {
		const setup = () => {
			const board = readBoardFixture();
			const richTextHtml = findDescription(board, 'Rich text');
			const expectedSections = [
				{
					title: 'Green',
					color: '#3cdd3c',
					cards: [
						{
							title: '',
							color: '#93ec93',
							elements: [file('img1.jpg', 'image/jpeg', 133462, '6ea14b97-3630-49ed-a923-3c70e36ea2c8')],
						},
					],
				},
				{
					title: 'Yellow',
					color: '#dddd3c',
					cards: [
						{
							title: 'FWU',
							color: '#ecec93',
							elements: [{ type: IntermediateElementType.LINK, url: 'https://fwu.de' }],
						},
						{ title: 'Rich text', color: '#ecec93', elements: [text(richTextHtml)] },
					],
				},
				{
					title: 'Red',
					color: '#981b1b',
					cards: [
						{ title: 'Foobar', color: '#ffffff', elements: [] },
						{
							title: 'Collapsed ugly card',
							color: '#dd3c3c',
							elements: [
								text('Picture + colors changed'),
								file('img1.jpg', 'image/jpeg', 133462, '1b0bf8d0-3cad-4957-b031-dcf8d7d01594'),
							],
						},
					],
				},
				{
					title: 'No color',
					color: '#ffffff',
					cards: [
						{
							title: 'Video call',
							color: '#ffffff',
							elements: [{ type: IntermediateElementType.VIDEO_CONFERENCE }],
						},
						{
							title: 'PDF',
							color: '#ffffff',
							elements: [file('FWU Katalog.pdf', 'application/pdf', 10288802, 'b49a53ac-2a25-46b7-8925-19c365f3dff8')],
						},
					],
				},
			];

			return { board, expectedSections };
		};

		it('should return the version, the source, the title and the description of the board', () => {
			const { board } = setup();

			const result = mapTaskcardsBoard(board, source);

			expect(result).toEqual(
				expect.objectContaining({
					version: 1,
					source,
					title: board.name,
					description: board.description,
				})
			);
		});

		it('should return one section for each list and one card for each card, in the order of the positions', () => {
			const { board, expectedSections } = setup();

			const result = mapTaskcardsBoard(board, source);

			expect(result.sections).toEqual(expectedSections);
		});
	});

	describe('when a card has all kinds of content', () => {
		const setup = () => {
			const description = '<b>Text</b>';
			const link = 'https://example.com';
			const board = {
				type: 0,
				lists: [{ id: 'list', name: 'List', position: 0 }],
				cards: [
					{
						title: 'Card',
						description,
						link,
						videoConference: 'Moderator',
						enableContract: true,
						attachments: [
							{ filename: 'a.pdf', length: 'unknown' },
							{ filename: 'b.pdf', downloadLink: '' },
						],
						kanbanPosition: { listId: 'list', position: 0 },
					},
				],
			};
			const expectedElements = [
				{ type: IntermediateElementType.VIDEO_CONFERENCE },
				text(description),
				{ type: IntermediateElementType.LINK, url: link },
				{
					type: IntermediateElementType.FILE,
					name: 'a.pdf',
					url: undefined,
					mimeType: undefined,
					sizeInBytes: undefined,
				},
				{
					type: IntermediateElementType.FILE,
					name: 'b.pdf',
					url: undefined,
					mimeType: undefined,
					sizeInBytes: undefined,
				},
				{ type: IntermediateElementType.NOT_SUPPORTED, kind: TASKCARDS_NOT_SUPPORTED_KIND_CONTACT },
			];

			return { board, expectedElements };
		};

		it('should return one element for each content, in a fixed order, and the contact function as not supported', () => {
			const { board, expectedElements } = setup();

			const result = mapTaskcardsBoard(board, source);

			expect(result.sections[0].cards[0].elements).toEqual(expectedElements);
		});
	});

	describe('when the board has content that the target board does not permit', () => {
		const setup = () => {
			const longTitle = 'a'.repeat(300);
			const board = {
				type: 0,
				name: longTitle,
				lists: [
					{ id: 'empty-list', name: '', position: 0 },
					{ id: 'list', name: longTitle, position: 1 },
				],
				cards: [{ title: '', description: '  ', link: '', kanbanPosition: { listId: 'list', position: 0 } }],
			};
			const expectedSections = [
				{ title: '', color: undefined, cards: [] },
				{ title: longTitle, color: undefined, cards: [{ title: '', color: undefined, elements: [] }] },
			];

			return { board, longTitle, expectedSections };
		};

		it('should keep long titles, empty sections and empty cards', () => {
			const { board, longTitle, expectedSections } = setup();

			const result = mapTaskcardsBoard(board, source);

			expect(result.title).toBe(longTitle);
			expect(result.sections).toEqual(expectedSections);
		});
	});

	describe('when cards have no list or a list that does not exist', () => {
		const setup = () => {
			const board = {
				type: 0,
				lists: [{ id: 'list', name: 'List', position: 0 }],
				cards: [
					{ title: 'Unknown list', kanbanPosition: { listId: 'other', position: 1 } },
					{ title: 'No position', kanbanPosition: null },
					{ title: 'In list', kanbanPosition: { listId: 'list', position: 0 } },
				],
			};
			const expectedSections = [
				{ title: 'List', color: undefined, cards: [{ title: 'In list', color: undefined, elements: [] }] },
				{
					title: TASKCARDS_SECTION_TITLE_FOR_CARDS_WITHOUT_LIST,
					cards: [
						{ title: 'No position', color: undefined, elements: [] },
						{ title: 'Unknown list', color: undefined, elements: [] },
					],
				},
			];

			return { board, expectedSections };
		};

		it('should put these cards into an additional last section', () => {
			const { board, expectedSections } = setup();

			const result = mapTaskcardsBoard(board, source);

			expect(result.sections).toEqual(expectedSections);
		});
	});

	describe('when lists or cards have the same position', () => {
		const setup = () => {
			const board = {
				type: 0,
				lists: [
					{ id: 'first', name: 'First', position: 0 },
					{ id: 'second', name: 'Second', position: 0 },
				],
				cards: [
					{ title: 'Card 1', kanbanPosition: { listId: 'first', position: 0 } },
					{ title: 'Card 2', kanbanPosition: { listId: 'first', position: 0 } },
				],
			};
			const expectedSectionTitles = ['First', 'Second'];
			const expectedCardTitles = ['Card 1', 'Card 2'];

			return { board, expectedSectionTitles, expectedCardTitles };
		};

		it('should keep the order of the answer', () => {
			const { board, expectedSectionTitles, expectedCardTitles } = setup();

			const result = mapTaskcardsBoard(board, source);

			expect(result.sections.map((section) => section.title)).toEqual(expectedSectionTitles);
			expect(result.sections[0].cards.map((card) => card.title)).toEqual(expectedCardTitles);
		});
	});

	describe('when the board has values of a wrong type', () => {
		const setup = () => {
			const board = {
				type: 0,
				name: 1,
				description: null,
				lists: [null, 'list', { id: 'list', name: 2, position: '1', color: 3 }],
				cards: [
					'card',
					{ title: null, description: 4, link: 5, attachments: 'none', kanbanPosition: { listId: 'list' } },
				],
			};
			const expectedBoard = {
				version: 1,
				source,
				title: '',
				description: '',
				sections: [{ title: '', color: undefined, cards: [{ title: '', color: undefined, elements: [] }] }],
			};

			return { board, expectedBoard };
		};

		it('should use empty values and skip entries that are not objects', () => {
			const { board, expectedBoard } = setup();

			const result = mapTaskcardsBoard(board, source);

			expect(result).toEqual(expectedBoard);
		});
	});

	describe('when the board has no lists and no cards', () => {
		it('should return a board without sections', () => {
			const result = mapTaskcardsBoard({ type: 0 }, source);

			expect(result.sections).toEqual([]);
		});
	});

	describe.each([1, 2, 3, 4, null, undefined, '0'])('when the board has the type %p', (type) => {
		it('should reject the job with the reason that the board type is not supported', () => {
			let error: unknown;
			try {
				mapTaskcardsBoard({ type }, source);
			} catch (thrownError: unknown) {
				error = thrownError;
			}

			expect(error).toBeInstanceOf(BoardImportJobRejectedError);
			expect(error).toHaveProperty('reason', BoardImportJobLogReason.SOURCE_BOARD_TYPE_NOT_SUPPORTED);
		});
	});
});
