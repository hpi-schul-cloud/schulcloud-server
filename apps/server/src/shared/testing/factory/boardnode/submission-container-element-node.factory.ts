/* istanbul ignore file */

import {
	SubmissionContainerElementNode,
	SubmissionContainerNodeProps,
} from '@shared/domain/entity/boardnode/submission-container-element-node.entity';
import { BaseFactory } from '../base.factory';

export const submissionContainerElementNodeFactory = BaseFactory.define<
	SubmissionContainerElementNode,
	SubmissionContainerNodeProps
>(SubmissionContainerElementNode, () => {
	return {
		dueDate: null,
	};
});
