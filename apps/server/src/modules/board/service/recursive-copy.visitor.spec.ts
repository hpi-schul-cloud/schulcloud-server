import {
	Card,
	Column,
	ColumnBoard,
	isCard,
	isColumn,
	isColumnBoard,
	isRichTextElement,
	isSubmissionContainerElement,
	RichTextElement,
	SubmissionContainerElement,
} from '@shared/domain';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '@shared/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { RecursiveCopyVisitor } from './recursive-copy.visitor';

describe('recursive board copy visitor', () => {
	describe('copying column boards', () => {
		const getColumnBoardCopyFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isColumnBoard(copy)).toEqual(true);
			return copy as ColumnBoard;
		};

		describe('when copying empty column board', () => {
			const setup = () => {
				const board = columnBoardFactory.build();
				const visitor = new RecursiveCopyVisitor();

				return { board, visitor };
			};

			it('should return a columnboard as copy', () => {
				const { board, visitor } = setup();

				const copy = visitor.copy(board).copyEntity;

				expect(isColumnBoard(copy)).toEqual(true);
			});

			it('should copy title', () => {
				const { board, visitor } = setup();

				const result = visitor.copy(board);
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.title).toEqual(board.title);
			});

			it('should create new id', () => {
				const { board, visitor } = setup();

				const result = visitor.copy(board);
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.id).not.toEqual(board.id);
			});

			it('should copy the context', () => {
				const { board, visitor } = setup();

				const result = visitor.copy(board);
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.context).toEqual(board.context);
			});

			it('should show status successful', () => {
				const { board, visitor } = setup();

				const result = visitor.copy(board);

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type Columnboard', () => {
				const { board, visitor } = setup();

				const result = visitor.copy(board);

				expect(result.type).toEqual(CopyElementType.COLUMNBOARD);
			});
		});

		describe('when copying a columnboard with children', () => {
			const setup = () => {
				const children = columnFactory.buildList(5);

				const columnBoardWithChildren = columnBoardFactory.build({ children });

				const visitor = new RecursiveCopyVisitor();

				return { columnBoardWithChildren, visitor };
			};

			it('should add children to copy of columnboard', () => {
				const { columnBoardWithChildren, visitor } = setup();

				const result = visitor.copy(columnBoardWithChildren);
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.children.length).toEqual(columnBoardWithChildren.children.length);
			});

			it('should create copies of children', () => {
				const { columnBoardWithChildren, visitor } = setup();

				const result = visitor.copy(columnBoardWithChildren);
				const copy = getColumnBoardCopyFromStatus(result);

				const originalChildIds = columnBoardWithChildren.children.map((child) => child.id);
				const copyChildrenIds = copy.children.map((child) => child.id);

				originalChildIds.forEach((id) => {
					const index = copyChildrenIds.findIndex((value) => value === id);
					expect(index).toEqual(-1);
				});
			});

			it('should add status of child copies to copystatus', () => {
				const { columnBoardWithChildren, visitor } = setup();

				const result = visitor.copy(columnBoardWithChildren);

				expect(result.elements?.length).toEqual(columnBoardWithChildren.children.length);
			});
		});
	});

	describe('copying a column', () => {
		const getColumnCopyFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isColumn(copy)).toEqual(true);
			return copy as Column;
		};

		describe('when copying an empty column', () => {
			const setup = () => {
				const column = columnFactory.build();
				const visitor = new RecursiveCopyVisitor();

				return { column, visitor };
			};

			it('should return a column as copy', () => {
				const { column, visitor } = setup();

				const copy = visitor.copy(column).copyEntity;

				expect(isColumn(copy)).toEqual(true);
			});

			it('should copy title', () => {
				const { column, visitor } = setup();

				const result = visitor.copy(column);
				const copy = getColumnCopyFromStatus(result);

				expect(copy.title).toEqual(column.title);
			});

			it('should create new id', () => {
				const { column, visitor } = setup();

				const result = visitor.copy(column);
				const copy = getColumnCopyFromStatus(result);

				expect(copy.id).not.toEqual(column.id);
			});

			it('should show status successful', () => {
				const { column, visitor } = setup();

				const result = visitor.copy(column);

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type Column', () => {
				const { column, visitor } = setup();

				const result = visitor.copy(column);

				expect(result.type).toEqual(CopyElementType.COLUMN);
			});
		});

		describe('when copying a column with children', () => {
			const setup = () => {
				const children = cardFactory.buildList(2);
				const column = columnFactory.build({ children });

				const visitor = new RecursiveCopyVisitor();

				return { column, visitor };
			};

			it('should add children to copy of columnboard', () => {
				const { column, visitor } = setup();

				const result = visitor.copy(column);
				const copy = getColumnCopyFromStatus(result);

				expect(copy.children.length).toEqual(column.children.length);
			});

			it('should create copies of children', () => {
				const { column, visitor } = setup();

				const result = visitor.copy(column);
				const copy = getColumnCopyFromStatus(result);

				const originalChildIds = column.children.map((child) => child.id);
				const copyChildrenIds = copy.children.map((child) => child.id);

				originalChildIds.forEach((id) => {
					const index = copyChildrenIds.findIndex((value) => value === id);
					expect(index).toEqual(-1);
				});
			});

			it('should add status of child copies to copystatus', () => {
				const { column, visitor } = setup();

				const result = visitor.copy(column);

				expect(result.elements?.length).toEqual(column.children.length);
			});
		});
	});

	describe('copying cards', () => {
		const getCardCopyFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isCard(copy)).toEqual(true);
			return copy as Card;
		};

		describe('when copying an empty card', () => {
			const setup = () => {
				const card = cardFactory.build();
				const visitor = new RecursiveCopyVisitor();

				return { card, visitor };
			};

			it('should return a richtext element as copy', () => {
				const { card, visitor } = setup();

				const copy = visitor.copy(card).copyEntity;

				expect(isCard(copy)).toEqual(true);
			});

			it('should copy title', () => {
				const { card, visitor } = setup();

				const result = visitor.copy(card);
				const copy = getCardCopyFromStatus(result);

				expect(copy.title).toEqual(card.title);
			});

			it('should copy height', () => {
				const { card, visitor } = setup();

				const result = visitor.copy(card);
				const copy = getCardCopyFromStatus(result);

				expect(copy.height).toEqual(card.height);
			});

			it('should create new id', () => {
				const { card, visitor } = setup();

				const result = visitor.copy(card);
				const copy = getCardCopyFromStatus(result);

				expect(copy.id).not.toEqual(card.id);
			});

			it('should show status successful', () => {
				const { card, visitor } = setup();

				const result = visitor.copy(card);

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type Card', () => {
				const { card, visitor } = setup();

				const result = visitor.copy(card);

				expect(result.type).toEqual(CopyElementType.CARD);
			});
		});

		describe('when copying a card with children', () => {
			const setup = () => {
				const children = [...richTextElementFactory.buildList(4), ...submissionContainerElementFactory.buildList(3)];
				const card = cardFactory.build({ children });

				const visitor = new RecursiveCopyVisitor();

				return { card, visitor };
			};

			it('should add children to copy of columnboard', () => {
				const { card, visitor } = setup();

				const result = visitor.copy(card);
				const copy = getCardCopyFromStatus(result);

				expect(copy.children.length).toEqual(card.children.length);
			});

			it('should create copies of children', () => {
				const { card, visitor } = setup();

				const result = visitor.copy(card);
				const copy = getCardCopyFromStatus(result);

				const originalChildIds = card.children.map((child) => child.id);
				const copyChildrenIds = copy.children.map((child) => child.id);

				originalChildIds.forEach((id) => {
					const index = copyChildrenIds.findIndex((value) => value === id);
					expect(index).toEqual(-1);
				});
			});

			it('should add status of child copies to copystatus', () => {
				const { card, visitor } = setup();

				const result = visitor.copy(card);

				expect(result.elements?.length).toEqual(card.children.length);
			});
		});
	});

	describe('when copying a richtext element', () => {
		const setup = () => {
			const richTextElement = richTextElementFactory.build();
			const visitor = new RecursiveCopyVisitor();

			return { richTextElement, visitor };
		};

		const getRichTextFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isRichTextElement(copy)).toEqual(true);
			return copy as RichTextElement;
		};

		it('should return a richtext element as copy', () => {
			const { richTextElement, visitor } = setup();

			const copy = visitor.copy(richTextElement).copyEntity;

			expect(isRichTextElement(copy)).toEqual(true);
		});

		it('should copy text', () => {
			const { richTextElement, visitor } = setup();

			const result = visitor.copy(richTextElement);
			const copy = getRichTextFromStatus(result);

			expect(copy.text).toEqual(richTextElement.text);
		});

		it('should copy text', () => {
			const { richTextElement, visitor } = setup();

			const result = visitor.copy(richTextElement);
			const copy = getRichTextFromStatus(result);

			expect(copy.inputFormat).toEqual(richTextElement.inputFormat);
		});

		it('should create new id', () => {
			const { richTextElement, visitor } = setup();

			const result = visitor.copy(richTextElement);
			const copy = getRichTextFromStatus(result);

			expect(copy.id).not.toEqual(richTextElement.id);
		});

		it('should show status successful', () => {
			const { richTextElement, visitor } = setup();

			const result = visitor.copy(richTextElement);

			expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should show type RichTextElement', () => {
			const { richTextElement, visitor } = setup();

			const result = visitor.copy(richTextElement);

			expect(result.type).toEqual(CopyElementType.RICHTEXT_ELEMENT);
		});
	});

	describe('copying submission container', () => {
		const getSubmissionContainerFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isSubmissionContainerElement(copy)).toEqual(true);
			return copy as SubmissionContainerElement;
		};

		describe('when copying an empty submission container element', () => {
			const setup = () => {
				const submissionContainer = submissionContainerElementFactory.build();
				const visitor = new RecursiveCopyVisitor();

				return { submissionContainer, visitor };
			};

			it('should return a submission container element as copy', () => {
				const { submissionContainer, visitor } = setup();

				const copy = visitor.copy(submissionContainer).copyEntity;

				expect(isSubmissionContainerElement(copy)).toEqual(true);
			});

			it('should copy dueDate', () => {
				const { submissionContainer, visitor } = setup();

				const result = visitor.copy(submissionContainer);
				const copy = getSubmissionContainerFromStatus(result);

				expect(copy.dueDate).toEqual(submissionContainer.dueDate);
			});

			it('should create new id', () => {
				const { submissionContainer, visitor } = setup();

				const result = visitor.copy(submissionContainer);
				const copy = getSubmissionContainerFromStatus(result);

				expect(copy.id).not.toEqual(submissionContainer.id);
			});

			it('should show status successful', () => {
				const { submissionContainer, visitor } = setup();

				const result = visitor.copy(submissionContainer);

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type SUBMISSION_CONTAINER', () => {
				const { submissionContainer, visitor } = setup();

				const result = visitor.copy(submissionContainer);

				expect(result.type).toEqual(CopyElementType.SUBMISSION_CONTAINER_ELEMENT);
			});
		});

		describe('when copying a card with children', () => {
			const setup = () => {
				const children = [...submissionItemFactory.buildList(4)];
				const container = submissionContainerElementFactory.build({ children });

				const visitor = new RecursiveCopyVisitor();

				return { container, visitor };
			};

			it('should NOT add children to copy of columnboard', () => {
				const { container, visitor } = setup();

				const result = visitor.copy(container);
				const copy = getSubmissionContainerFromStatus(result);

				expect(copy.children.length).toEqual(0);
			});

			it('should add status of child copies to copystatus', () => {
				const { container, visitor } = setup();

				const result = visitor.copy(container);

				expect(result.elements?.length).toEqual(container.children.length);
			});
		});
	});

	describe('when copying a submission item', () => {
		const setup = () => {
			const submissionItem = submissionItemFactory.build();
			const visitor = new RecursiveCopyVisitor();

			return { submissionItem, visitor };
		};

		it('should NOT make a copy', () => {
			const { submissionItem, visitor } = setup();

			const result = visitor.copy(submissionItem);

			expect(result.copyEntity).toBeUndefined();
		});

		it('should show status not-doing', () => {
			const { submissionItem, visitor } = setup();

			const result = visitor.copy(submissionItem);

			expect(result.status).toEqual(CopyStatusEnum.NOT_DOING);
		});

		it('should show type SUBMISSION_ITEM', () => {
			const { submissionItem, visitor } = setup();

			const result = visitor.copy(submissionItem);

			expect(result.type).toEqual(CopyElementType.SUBMISSION_ITEM);
		});
	});
});
