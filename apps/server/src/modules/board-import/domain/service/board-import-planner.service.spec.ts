import { intermediateBoardFactory } from '../../testing';
import {
	BOARD_PLAN_VERSION,
	type BoardImportNote,
	BoardImportNoteType,
	type BoardPlan,
	type IntermediateCard,
	IntermediateElementType,
	PlannedElementType,
} from '../type';
import {
	BOARD_TITLE_FALLBACK,
	BOARD_TITLE_MAX_LENGTH,
	BoardImportPlannerService,
} from './board-import-planner.service';

describe(BoardImportPlannerService.name, () => {
	const service = new BoardImportPlannerService();

	describe('plan', () => {
		describe('when the board has sections with cards and text', () => {
			const setup = () => {
				const html = '<p>Text <strong>bold</strong></p>';
				const board = intermediateBoardFactory.build({
					title: 'Board',
					sections: [
						{
							title: 'First',
							color: '#ff0000',
							cards: [
								{ title: 'Card 1', color: '#00ff00', elements: [{ type: IntermediateElementType.TEXT, html }] },
								{ title: 'Card 2', elements: [] },
							],
						},
						{ title: 'Second', cards: [{ title: '', elements: [{ type: IntermediateElementType.TEXT, html }] }] },
					],
				});
				const expectedPlan: BoardPlan = {
					version: BOARD_PLAN_VERSION,
					title: 'Board',
					columns: [
						{
							title: 'First',
							cards: [
								{ title: 'Card 1', elements: [{ type: PlannedElementType.TEXT, html }] },
								{ title: 'Card 2', elements: [] },
							],
						},
						{ title: 'Second', cards: [{ title: '', elements: [{ type: PlannedElementType.TEXT, html }] }] },
					],
				};

				return { board, expectedPlan };
			};

			it('should plan one column for each section and one card for each card, in the order of the source', () => {
				const { board, expectedPlan } = setup();

				const result = service.plan(board);

				expect(result.plan).toEqual(expectedPlan);
			});

			it('should write no notes', () => {
				const { board } = setup();

				const result = service.plan(board);

				expect(result.notes).toEqual([]);
			});
		});

		describe('when the title of the board has the maximum length', () => {
			const setup = () => {
				const title = 'a'.repeat(BOARD_TITLE_MAX_LENGTH);
				const board = intermediateBoardFactory.build({ title });

				return { board, title };
			};

			it('should keep the title and write no note', () => {
				const { board, title } = setup();

				const result = service.plan(board);

				expect(result.plan.title).toEqual(title);
				expect(result.notes).toEqual([]);
			});
		});

		describe('when the title of the board is too long', () => {
			const setup = () => {
				const expectedTitle = 'a'.repeat(BOARD_TITLE_MAX_LENGTH);
				const board = intermediateBoardFactory.build({ title: `${expectedTitle}b` });
				const expectedNotes: BoardImportNote[] = [{ type: BoardImportNoteType.BOARD_TITLE_SHORTENED }];

				return { board, expectedTitle, expectedNotes };
			};

			it('should shorten the title to the maximum length', () => {
				const { board, expectedTitle } = setup();

				const result = service.plan(board);

				expect(result.plan.title).toEqual(expectedTitle);
			});

			it('should write a note', () => {
				const { board, expectedNotes } = setup();

				const result = service.plan(board);

				expect(result.notes).toEqual(expectedNotes);
			});
		});

		describe('when a long title has characters of two UTF-16 code units', () => {
			const setup = () => {
				const expectedTitle = '😀'.repeat(BOARD_TITLE_MAX_LENGTH);
				const board = intermediateBoardFactory.build({ title: `${expectedTitle}😀` });

				return { board, expectedTitle };
			};

			it('should count each of these characters once and keep it whole', () => {
				const { board, expectedTitle } = setup();

				const result = service.plan(board);

				expect(result.plan.title).toEqual(expectedTitle);
			});
		});

		describe.each(['', ' \n ', '<Mathe>'])('when the title of the board is %j', (title) => {
			const setup = () => {
				const board = intermediateBoardFactory.build({ title });

				return { board };
			};

			it('should use the fallback title and write no note', () => {
				const { board } = setup();

				const result = service.plan(board);

				expect(result.plan.title).toEqual(BOARD_TITLE_FALLBACK);
				expect(result.notes).toEqual([]);
			});
		});

		describe('when titles have line breaks', () => {
			const setup = () => {
				const board = intermediateBoardFactory.build({
					title: ' Board\r\ntitle ',
					sections: [{ title: 'Section \n title', cards: [{ title: 'Card\n\n title\n', elements: [] }] }],
				});
				const expectedPlan: BoardPlan = {
					version: BOARD_PLAN_VERSION,
					title: 'Board title',
					columns: [{ title: 'Section title', cards: [{ title: 'Card title', elements: [] }] }],
				};

				return { board, expectedPlan };
			};

			it('should replace each line break with one space', () => {
				const { board, expectedPlan } = setup();

				const result = service.plan(board);

				expect(result.plan).toEqual(expectedPlan);
			});
		});

		describe('when titles of a section and a card are longer than the maximum length of the board title', () => {
			const setup = () => {
				const title = 'a'.repeat(BOARD_TITLE_MAX_LENGTH + 1);
				const board = intermediateBoardFactory.build({ sections: [{ title, cards: [{ title, elements: [] }] }] });

				return { board, title };
			};

			it('should keep the titles', () => {
				const { board, title } = setup();

				const result = service.plan(board);

				expect(result.plan.columns).toEqual([{ title, cards: [{ title, elements: [] }] }]);
				expect(result.notes).toEqual([]);
			});
		});

		describe('when the board has a description', () => {
			const setup = () => {
				const board = intermediateBoardFactory.build({ description: 'Description' });
				const expectedNotes: BoardImportNote[] = [{ type: BoardImportNoteType.BOARD_DESCRIPTION_LEFT_OUT }];

				return { board, expectedNotes };
			};

			it('should write a note', () => {
				const { board, expectedNotes } = setup();

				const result = service.plan(board);

				expect(result.notes).toEqual(expectedNotes);
			});
		});

		describe('when a section has empty cards', () => {
			const setup = () => {
				const emptyCard: IntermediateCard = { title: '', elements: [] };
				const cardWithTitle: IntermediateCard = { title: 'Card', elements: [] };
				const board = intermediateBoardFactory.build({
					sections: [
						{ title: 'First', cards: [emptyCard, cardWithTitle, { title: ' \n', elements: [] }] },
						{ title: 'Second', cards: [emptyCard] },
						{ title: 'Third', cards: [] },
					],
				});
				const expectedColumns = [
					{ title: 'First', cards: [{ title: 'Card', elements: [] }] },
					{ title: 'Second', cards: [] },
					{ title: 'Third', cards: [] },
				];

				return { board, expectedColumns };
			};

			it('should leave out the empty cards and keep the empty sections', () => {
				const { board, expectedColumns } = setup();

				const result = service.plan(board);

				expect(result.plan.columns).toEqual(expectedColumns);
			});

			it('should write no notes', () => {
				const { board } = setup();

				const result = service.plan(board);

				expect(result.notes).toEqual([]);
			});
		});

		describe('when cards have elements that are not text', () => {
			const setup = () => {
				const html = '<p>Text</p>';
				const board = intermediateBoardFactory.build({
					sections: [
						{
							title: 'Section',
							cards: [
								{
									title: 'Card',
									elements: [
										{ type: IntermediateElementType.VIDEO_CONFERENCE },
										{ type: IntermediateElementType.TEXT, html },
										{ type: IntermediateElementType.LINK, url: 'https://example.com' },
										{ type: IntermediateElementType.FILE, name: 'file.pdf' },
										{ type: IntermediateElementType.NOT_SUPPORTED, kind: 'contact' },
									],
								},
								{ title: '', elements: [{ type: IntermediateElementType.LINK, url: 'https://example.com' }] },
							],
						},
					],
				});
				const expectedColumns = [
					{ title: 'Section', cards: [{ title: 'Card', elements: [{ type: PlannedElementType.TEXT, html }] }] },
				];
				const place = { sectionTitle: 'Section', cardTitle: 'Card' };
				const type = BoardImportNoteType.ELEMENT_LEFT_OUT;
				const expectedNotes: BoardImportNote[] = [
					{ type, ...place, elementType: IntermediateElementType.VIDEO_CONFERENCE },
					{ type, ...place, elementType: IntermediateElementType.LINK },
					{ type, ...place, elementType: IntermediateElementType.FILE },
					{ type, ...place, elementType: IntermediateElementType.NOT_SUPPORTED, elementKind: 'contact' },
					{ type, sectionTitle: 'Section', cardTitle: '', elementType: IntermediateElementType.LINK },
				];

				return { board, expectedColumns, expectedNotes };
			};

			it('should plan only the text elements and leave out a card that has nothing left', () => {
				const { board, expectedColumns } = setup();

				const result = service.plan(board);

				expect(result.plan.columns).toEqual(expectedColumns);
			});

			it('should write a note with the place for each element that it leaves out', () => {
				const { board, expectedNotes } = setup();

				const result = service.plan(board);

				expect(result.notes).toEqual(expectedNotes);
			});
		});

		describe('when the title is too long and the board has a description and other elements', () => {
			const setup = () => {
				const board = intermediateBoardFactory.build({
					title: 'a'.repeat(BOARD_TITLE_MAX_LENGTH + 1),
					description: 'Description',
					sections: [
						{
							title: 'Section',
							cards: [{ title: 'Card', elements: [{ type: IntermediateElementType.VIDEO_CONFERENCE }] }],
						},
					],
				});
				const expectedTypes = [
					BoardImportNoteType.BOARD_TITLE_SHORTENED,
					BoardImportNoteType.BOARD_DESCRIPTION_LEFT_OUT,
					BoardImportNoteType.ELEMENT_LEFT_OUT,
				];

				return { board, expectedTypes };
			};

			it('should write the notes of the board before the notes of the cards', () => {
				const { board, expectedTypes } = setup();

				const result = service.plan(board);

				expect(result.notes.map((note) => note.type)).toEqual(expectedTypes);
			});
		});
	});
});
