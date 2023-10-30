import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InputFormat } from '@shared/domain/types/input-format.types';
import { richTextElementFactory } from '@shared/testing/factory/domainobject/board/rich-text-element.do.factory';
import { RichTextElementNode } from './rich-text-element-node.entity';
import { BoardDoBuilder } from './types/board-do.builder';
import { BoardNodeType } from './types/board-node-type';

describe(RichTextElementNode.name, () => {
	describe('when trying to create a rich text element', () => {
		const setup = () => {
			const elementProps = { text: 'Test', inputFormat: InputFormat.RICH_TEXT_CK5 };
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();

			return { elementProps, builder };
		};

		it('should create a FileElementNode', () => {
			const { elementProps } = setup();

			const element = new RichTextElementNode(elementProps);

			expect(element.type).toEqual(BoardNodeType.RICH_TEXT_ELEMENT);
		});
	});

	describe('useDoBuilder()', () => {
		const setup = () => {
			const element = new RichTextElementNode({ text: 'Test', inputFormat: InputFormat.RICH_TEXT_CK5 });
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();
			const elementDo = richTextElementFactory.build();

			builder.buildRichTextElement.mockReturnValue(elementDo);

			return { element, builder, elementDo };
		};

		it('should call the specific builder method', () => {
			const { element, builder } = setup();

			element.useDoBuilder(builder);

			expect(builder.buildRichTextElement).toHaveBeenCalledWith(element);
		});

		it('should return RichTextElementDo', () => {
			const { element, builder, elementDo } = setup();

			const result = element.useDoBuilder(builder);

			expect(result).toEqual(elementDo);
		});
	});
});
