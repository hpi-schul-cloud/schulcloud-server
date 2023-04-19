import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { cardFactory, fileElementFactory } from '@shared/testing';
import { FileElement } from './file-element.do';
import { BoardNodeBuilder } from './types';

describe(FileElement.name, () => {
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

		it('should throw an error ', () => {
			const fileElement = fileElementFactory.build();
			const fileElementChild = fileElementFactory.build();

			expect(() => fileElement.addChild(fileElementChild)).toThrow();
		});
	});
});
