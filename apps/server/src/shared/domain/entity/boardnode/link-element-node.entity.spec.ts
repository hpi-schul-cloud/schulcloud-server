import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { linkElementFactory } from '@shared/testing/factory';
import { LinkElementNode } from './link-element-node.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

describe(LinkElementNode.name, () => {
	describe('when trying to create a link element', () => {
		const setup = () => {
			const elementProps = { url: 'https://www.any-fake.url/that-is-linked.html', title: 'A Great WebPage' };
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();

			return { elementProps, builder };
		};

		it('should create a LinkElementNode', () => {
			const { elementProps } = setup();

			const element = new LinkElementNode(elementProps);

			expect(element.type).toEqual(BoardNodeType.LINK_ELEMENT);
		});
	});

	describe('useDoBuilder()', () => {
		const setup = () => {
			const element = new LinkElementNode({
				url: 'https://www.any-fake.url/that-is-linked.html',
				title: 'A Great WebPage',
			});
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();
			const elementDo = linkElementFactory.build();

			builder.buildLinkElement.mockReturnValue(elementDo);

			return { element, builder, elementDo };
		};

		it('should call the specific builder method', () => {
			const { element, builder } = setup();

			element.useDoBuilder(builder);

			expect(builder.buildLinkElement).toHaveBeenCalledWith(element);
		});

		it('should return RichTextElementDo', () => {
			const { element, builder, elementDo } = setup();

			const result = element.useDoBuilder(builder);

			expect(result).toEqual(elementDo);
		});
	});
});
