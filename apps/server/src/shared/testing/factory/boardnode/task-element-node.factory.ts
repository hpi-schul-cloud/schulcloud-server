/* istanbul ignore file */
import { SubmissionContainerElementNode, TaskElementNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const taskElementNodeFactory = BaseFactory.define<SubmissionContainerElementNode, TaskElementNodeProps>(
	SubmissionContainerElementNode,
	() => {
		const inThreeDays = new Date(Date.now() + 259200000);
		return {
			dueDate: inThreeDays,
		};
	}
);
