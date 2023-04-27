import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { cardFactory, fileElementFactory } from '@shared/testing';
import { FileElement } from './file-element.do';
import { BoardNodeBuilder } from './types';

describe(FileElement.name, () => {
	describe('useBoardNodeBuilder', () => {
		const setup = () => {
			const element = fileElementFactory.build();
			const card = cardFactory.build();
			const builder: DeepMocked<BoardNodeBuilder> = createMock<BoardNodeBuilder>();

			return { element, builder, card };
		};

		describe('when trying to add a child to a file element', () => {
			it('should call the specific builder method', () => {
				const { element, builder, card } = setup();

				element.useBoardNodeBuilder(builder, card);

				expect(builder.buildFileElementNode).toHaveBeenCalledWith(element, card);
			});
		});

		describe('when trying to add an invalid element', () => {
			it('should throw an error ', () => {
				const { element } = setup();
				const fileElementChild = fileElementFactory.build();

				expect(() => element.addChild(fileElementChild)).toThrow();
			});
		});
	});
});
