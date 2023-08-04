/* istanbul ignore file */
import { SubmissionContainerElementNode, SubmissionContainerNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const submissionContainerElementNodeFactory = BaseFactory.define<
	SubmissionContainerElementNode,
	SubmissionContainerNodeProps
>(SubmissionContainerElementNode, () => {
	const inThreeDays = new Date(Date.now() + 259200000);
	return {
		dueDate: inThreeDays,
	};
});
