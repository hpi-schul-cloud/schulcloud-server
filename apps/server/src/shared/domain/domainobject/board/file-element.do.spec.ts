import { createMock } from '@golevelup/ts-jest';
import { fileElementFactory } from '@shared/testing/factory';
import { FileElement } from './file-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

describe(FileElement.name, () => {
	describe('get caption', () => {
		describe('when caption is set', () => {
			it('should return the caption', () => {
				const fileElement = fileElementFactory.build();

				expect(fileElement.caption).toEqual(fileElement.caption);
			});
		});

		describe('when caption is not set', () => {
			it('should return an empty string', () => {
				const fileElement = fileElementFactory.build({ caption: undefined });

				expect(fileElement.caption).toEqual('');
			});
		});
	});

	describe('set caption', () => {
		it('should set caption', () => {
			const fileElement = fileElementFactory.build();
			const text = 'new caption';
			fileElement.caption = text;

			expect(fileElement.caption).toEqual(text);
		});
	});

	describe('get alternative text', () => {
		describe('when alternative text is set', () => {
			it('should return the alternative text', () => {
				const fileElement = fileElementFactory.build();

				expect(fileElement.alternativeText).toEqual(fileElement.alternativeText);
			});
		});

		describe('when alternative text is not set', () => {
			it('should return an empty string', () => {
				const fileElement = fileElementFactory.build({ alternativeText: undefined });

				expect(fileElement.alternativeText).toEqual('');
			});
		});
	});

	describe('set alternative text', () => {
		it('should set alternative text', () => {
			const fileElement = fileElementFactory.build();
			const text = 'new alternative text';
			fileElement.alternativeText = text;

			expect(fileElement.alternativeText).toEqual(text);
		});
	});

	describe('when trying to add a child to a file element', () => {
		it('should throw an error ', () => {
			const fileElement = fileElementFactory.build();
			const fileElementChild = fileElementFactory.build();

			expect(() => fileElement.addChild(fileElementChild)).toThrow();
		});
	});

	describe('update caption', () => {
		it('should be able to update caption', () => {
			const fileElement = fileElementFactory.build();
			const text = 'this is the titanic movie from 1997 in Blue-Ray Quality';
			fileElement.caption = text;

			expect(fileElement.caption).toEqual(text);
		});
	});

	describe('update alternative text', () => {
		it('should be able to update alternative text', () => {
			const fileElement = fileElementFactory.build();
			const text = 'this is the titanic movie from 1997 in Blue-Ray Quality';
			fileElement.alternativeText = text;

			expect(fileElement.alternativeText).toEqual(text);
		});
	});

	describe('accept', () => {
		it('should call the right visitor method', () => {
			const visitor = createMock<BoardCompositeVisitor>();
			const fileElement = fileElementFactory.build();

			fileElement.accept(visitor);

			expect(visitor.visitFileElement).toHaveBeenCalledWith(fileElement);
		});
	});

	describe('acceptAsync', () => {
		it('should call the right async visitor method', async () => {
			const visitor = createMock<BoardCompositeVisitorAsync>();
			const fileElement = fileElementFactory.build();

			await fileElement.acceptAsync(visitor);

			expect(visitor.visitFileElementAsync).toHaveBeenCalledWith(fileElement);
		});
	});
});
