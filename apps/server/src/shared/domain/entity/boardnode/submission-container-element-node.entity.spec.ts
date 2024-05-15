import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { submissionContainerElementFactory } from '@shared/testing/factory';
import { SubmissionContainerElementNode } from './submission-container-element-node.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

const inThreeDays = new Date(Date.now() + 259200000);

describe(SubmissionContainerElementNode.name, () => {
	describe('when trying to create a submission container element', () => {
		const setup = () => {
			const elementProps = { dueDate: inThreeDays };
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();

			return { elementProps, builder };
		};

		it('should create a SubmissionContainerElement', () => {
			const { elementProps } = setup();

			const element = new SubmissionContainerElementNode(elementProps);

			expect(element.type).toEqual(BoardNodeType.SUBMISSION_CONTAINER_ELEMENT);
		});
	});

	describe('useDoBuilder()', () => {
		const setup = () => {
			const element = new SubmissionContainerElementNode({ dueDate: inThreeDays });
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();
			const elementDo = submissionContainerElementFactory.build();

			builder.buildSubmissionContainerElement.mockReturnValue(elementDo);

			return { element, builder, elementDo };
		};

		it('should call the specific builder method', () => {
			const { element, builder } = setup();

			element.useDoBuilder(builder);

			expect(builder.buildSubmissionContainerElement).toHaveBeenCalledWith(element);
		});

		it('should return ElementDo', () => {
			const { element, builder, elementDo } = setup();

			const result = element.useDoBuilder(builder);

			expect(result).toEqual(elementDo);
		});
	});
});
