/* istanbul ignore file */
import { TaskElementNode, TaskElementNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const taskElementNodeFactory = BaseFactory.define<TaskElementNode, TaskElementNodeProps>(TaskElementNode, () => {
	const inThreeDays = new Date(Date.now() + 259200000);
	return {
		dueDate: inThreeDays,
	};
});
