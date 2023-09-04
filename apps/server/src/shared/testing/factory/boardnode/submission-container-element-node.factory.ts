/* istanbul ignore file */
import { SubmissionContainerElementNode, SubmissionContainerNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const submissionContainerElementNodeFactory = BaseFactory.define<
	SubmissionContainerElementNode,
	SubmissionContainerNodeProps
>(SubmissionContainerElementNode, () => {
	return {
		dueDate: undefined,
	};
});
