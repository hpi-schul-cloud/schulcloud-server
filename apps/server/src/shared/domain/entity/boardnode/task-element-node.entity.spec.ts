import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { taskElementFactory } from '@shared/testing';
import { TaskElementNode } from './task-element-node.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

const inThreeDays = new Date(Date.now() + 259200000);

describe(TaskElementNode.name, () => {
	describe('when trying to create a task element', () => {
		const setup = () => {
			const elementProps = { dueDate: inThreeDays };
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();

			return { elementProps, builder };
		};

		it('should create a FileElementNode', () => {
			const { elementProps } = setup();

			const element = new TaskElementNode(elementProps);

			expect(element.type).toEqual(BoardNodeType.TASK_ELEMENT);
		});
	});

	describe('useDoBuilder()', () => {
		const setup = () => {
			const element = new TaskElementNode({ dueDate: inThreeDays });
			const builder: DeepMocked<BoardDoBuilder> = createMock<BoardDoBuilder>();
			const elementDo = taskElementFactory.build();

			builder.buildTaskElement.mockReturnValue(elementDo);

			return { element, builder, elementDo };
		};

		it('should call the specific builder method', () => {
			const { element, builder } = setup();

			element.useDoBuilder(builder);

			expect(builder.buildTaskElement).toHaveBeenCalledWith(element);
		});

		it('should call the specific builder method', () => {
			const { element, builder } = setup();

			element.useDoBuilder(builder);

			expect(builder.buildTaskElement).toHaveBeenCalledWith(element);
		});

		it('should return TaskElementDo', () => {
			const { element, builder, elementDo } = setup();

			const result = element.useDoBuilder(builder);

			expect(result).toEqual(elementDo);
		});
	});
});
