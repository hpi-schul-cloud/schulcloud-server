import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { submissionItemFactory } from '@shared/testing/factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { SubmissionItemNode } from './submission-item-node.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

describe(SubmissionItemNode.name, () => {
	describe('when trying to create a submission container element', () => {
		const setup = () => {
			const elementProps = { completed: false, userId: ObjectId.toString() };
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();

			return { elementProps, builder };
		};

		it('should create a SubmissionItem', () => {
			const { elementProps } = setup();

			const element = new SubmissionItemNode(elementProps);

			expect(element.type).toEqual(BoardNodeType.SUBMISSION_ITEM);
		});
	});

	describe('useDoBuilder()', () => {
		const setup = () => {
			const elementProps = { completed: false, userId: ObjectId.toString() };
			const element = new SubmissionItemNode(elementProps);

			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();
			const elementDo = submissionItemFactory.build();

			builder.buildSubmissionItem.mockReturnValue(elementDo);

			return { element, builder, elementDo };
		};

		it('should call the specific builder method', () => {
			const { element, builder } = setup();

			element.useDoBuilder(builder);

			expect(builder.buildSubmissionItem).toHaveBeenCalledWith(element);
		});

		it('should return ElementDo', () => {
			const { element, builder, elementDo } = setup();

			const result = element.useDoBuilder(builder);

			expect(result).toEqual(elementDo);
		});
	});
});
