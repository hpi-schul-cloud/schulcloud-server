import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { cardFactory, fileElementFactory } from '@shared/testing';
import { FileElement } from './file-element.do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync, BoardNodeBuilder } from './types';

describe(FileElement.name, () => {
	describe('useBoardNodeBuilder', () => {
		describe('when trying to add a child to a file element', () => {
			const setup = () => {
				const element = fileElementFactory.build();
				const card = cardFactory.build();
				const builder: DeepMocked<BoardNodeBuilder> = createMock<BoardNodeBuilder>();

				return { element, builder, card };
			};

			it('should call the specific builder method', () => {
				const { element, builder, card } = setup();

				element.useBoardNodeBuilder(builder, card);

				expect(builder.buildFileElementNode).toHaveBeenCalledWith(element, card);
			});
		});

		describe('when trying to add an invalid element', () => {
			const setup = () => {
				const element = fileElementFactory.build();
				const fileElementChild = fileElementFactory.build();

				return { element, fileElementChild };
			};

			it('should throw an error ', () => {
				const { element, fileElementChild } = setup();

				expect(() => element.addChild(fileElementChild)).toThrow();
			});
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
