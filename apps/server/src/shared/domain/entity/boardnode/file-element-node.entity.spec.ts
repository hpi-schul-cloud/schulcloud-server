import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { fileElementFactory } from '@shared/testing/factory';
import { FileElementNode } from './file-element-node.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

describe(FileElementNode.name, () => {
	describe('when trying to create a file element', () => {
		const setup = () => {
			const elementProps = { caption: 'Test', alternativeText: 'testAltText' };
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();

			return { elementProps, builder };
		};

		it('should create a FileElementNode', () => {
			const { elementProps } = setup();

			const element = new FileElementNode(elementProps);

			expect(element.type).toEqual(BoardNodeType.FILE_ELEMENT);
		});
	});

	describe('useDoBuilder()', () => {
		const setup = () => {
			const element = new FileElementNode({ caption: 'Test', alternativeText: 'altTest' });
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();
			const elementDo = fileElementFactory.build();

			builder.buildFileElement.mockReturnValue(elementDo);

			return { element, builder, elementDo };
		};

		it('should call the specific builder method', () => {
			const { element, builder } = setup();

			element.useDoBuilder(builder);

			expect(builder.buildFileElement).toHaveBeenCalledWith(element);
		});

		it('should return FileElementDo', () => {
			const { element, builder, elementDo } = setup();

			const result = element.useDoBuilder(builder);

			expect(result).toEqual(elementDo);
		});
	});
});
