import { Card, Column, ColumnBoard, isCard, isColumn, isColumnBoard } from '@shared/domain';
import { cardFactory, columnBoardFactory, columnFactory } from '@shared/testing';
import { CopyElementType, CopyStatusEnum } from '@src/modules/copy-helper';
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

		it('should return a columnboard as copy', () => {
			const { board, visitor } = setup();

			const copy = visitor.copy(board).copyEntity;

			expect(isColumnBoard(copy)).toEqual(true);
		});

		it('should copy title', () => {
			const { board, visitor } = setup();

			const copy = visitor.copy(board).copyEntity as ColumnBoard;

			expect(copy.title).toEqual(board.title);
		});

		it('should create new id', () => {
			const { board, visitor } = setup();

			const copy = visitor.copy(board).copyEntity as ColumnBoard;

			expect(copy.id).not.toEqual(board.id);
		});

		it('should copy the context', () => {
			const { board, visitor } = setup();

			const copy = visitor.copy(board).copyEntity as ColumnBoard;

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

		it('should return a columnboard as copy', () => {
			const { column, visitor } = setup();

			const copy = visitor.copy(column).copyEntity;

			expect(isColumn(copy)).toEqual(true);
		});

		it('should copy title', () => {
			const { column, visitor } = setup();

			const copy = visitor.copy(column).copyEntity as Column;

			expect(copy.title).toEqual(column.title);
		});

		it('should create new id', () => {
			const { column, visitor } = setup();

			const copy = visitor.copy(column).copyEntity as Column;

			expect(copy.id).not.toEqual(column.id);
		});

		it('should show status successful', () => {
			const { column, visitor } = setup();

			const result = visitor.copy(column);

			expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should show type Columnboard', () => {
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

		it('should return a columnboard as copy', () => {
			const { card, visitor } = setup();

			const copy = visitor.copy(card).copyEntity;

			expect(isCard(copy)).toEqual(true);
		});

		it('should copy title', () => {
			const { card, visitor } = setup();

			const copy = visitor.copy(card).copyEntity as Card;

			expect(copy.title).toEqual(card.title);
		});

		it('should copy height', () => {
			const { card, visitor } = setup();

			const copy = visitor.copy(card).copyEntity as Card;

			expect(copy.height).toEqual(card.height);
		});

		it('should create new id', () => {
			const { card, visitor } = setup();

			const copy = visitor.copy(card).copyEntity as Card;

			expect(copy.id).not.toEqual(card.id);
		});

		it('should show status successful', () => {
			const { card, visitor } = setup();

			const result = visitor.copy(card);

			expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should show type Columnboard', () => {
			const { card, visitor } = setup();

			const result = visitor.copy(card);

			expect(result.type).toEqual(CopyElementType.CARD);
		});
	});
});
