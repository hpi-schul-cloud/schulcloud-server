import { boardNodeFactory } from '@shared/testing/factory/boardnode.factory';
import { ColumnBuilder } from './column-builder';

describe('ColumnBuilder', () => {
	describe('when converting a boardnode', () => {
		it('should build a Column-DO when a boardNode of type COLUMN is given', () => {
			const boardNode = boardNodeFactory.asColumn().build();

			const domainObject = ColumnBuilder.build(boardNode);

			expect(domainObject?.constructor.name).toBe('Column');
		});

		it('should return undefined if the boardNode is not of type COLUMN', () => {
			const boardNode = boardNodeFactory.asCard().build();

			const domainObject = ColumnBuilder.build(boardNode);

			expect(domainObject).toBe(undefined);
		});
	});
});
