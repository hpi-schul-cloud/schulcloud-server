import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { richTextElementFactory } from '@shared/testing';
import { DrawingElementNode } from '@shared/domain/entity/boardnode/drawing-element-node.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

describe(DrawingElementNode.name, () => {
	describe('when trying to create a drawing element', () => {
		const setup = () => {
			const elementProps = { drawingName: 'test' };
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();

			return { elementProps, builder };
		};

		it('should create a FileElementNode', () => {
			const { elementProps } = setup();

			const element = new DrawingElementNode(elementProps);

			expect(element.type).toEqual(BoardNodeType.DRAWING_ELEMENT);
		});
	});

	describe('useDoBuilder()', () => {
		const setup = () => {
			const element = new DrawingElementNode({ drawingName: 'test' });
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();
			const elementDo = richTextElementFactory.build();

			builder.buildRichTextElement.mockReturnValue(elementDo);

			return { element, builder, elementDo };
		};

		it('should call the specific builder method', () => {
			const { element, builder } = setup();

			element.useDoBuilder(builder);

			expect(builder.buildDrawingElement).toHaveBeenCalledWith(element);
		});

		it('should call the specific builder method', () => {
			const { element, builder } = setup();

			element.useDoBuilder(builder);

			expect(builder.buildDrawingElement).toHaveBeenCalledWith(element);
		});

		it('should return RichTextElementDo', () => {
			const { element, builder, elementDo } = setup();

			const result = element.useDoBuilder(builder);

			expect(result).toEqual(elementDo);
		});
	});
});
