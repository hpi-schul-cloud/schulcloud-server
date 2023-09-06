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
} from '@shared/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { RecursiveCopyVisitor } from './recursive-copy.visitor';

describe('recursive board copy visitor', () => {
	it('should create visitor', () => {
		const visitor = new RecursiveCopyVisitor();
		expect(visitor).toBeInstanceOf(RecursiveCopyVisitor);
	});

	describe('when copying empty column board', () => {
		const setup = () => {
			const board = columnBoardFactory.build();
			const visitor = new RecursiveCopyVisitor();

			return { board, visitor };
		};

		const getColumnBoardCopyFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isColumnBoard(copy)).toEqual(true);
			return copy as ColumnBoard;
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

	describe('when copying an empty column', () => {
		const setup = () => {
			const column = columnFactory.build();
			const visitor = new RecursiveCopyVisitor();

			return { column, visitor };
		};

		const getColumnCopyFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isColumn(copy)).toEqual(true);
			return copy as Column;
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

	describe('when copying an empty card', () => {
		const setup = () => {
			const card = cardFactory.build();
			const visitor = new RecursiveCopyVisitor();

			return { card, visitor };
		};

		const getCardFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isCard(copy)).toEqual(true);
			return copy as Card;
		};

		it('should return a richtext element as copy', () => {
			const { card, visitor } = setup();

			const copy = visitor.copy(card).copyEntity;

			expect(isCard(copy)).toEqual(true);
		});

		it('should copy title', () => {
			const { card, visitor } = setup();

			const result = visitor.copy(card);
			const copy = getCardFromStatus(result);

			expect(copy.title).toEqual(card.title);
		});

		it('should copy height', () => {
			const { card, visitor } = setup();

			const result = visitor.copy(card);
			const copy = getCardFromStatus(result);

			expect(copy.height).toEqual(card.height);
		});

		it('should create new id', () => {
			const { card, visitor } = setup();

			const result = visitor.copy(card);
			const copy = getCardFromStatus(result);

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

	describe('when copying an empty richtext element', () => {
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

	describe('when copying an empty submission container element', () => {
		const setup = () => {
			const submissionContainer = submissionContainerElementFactory.build();
			const visitor = new RecursiveCopyVisitor();

			return { submissionContainer, visitor };
		};

		const getSubmissionContainerFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isSubmissionContainerElement(copy)).toEqual(true);
			return copy as SubmissionContainerElement;
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
});
