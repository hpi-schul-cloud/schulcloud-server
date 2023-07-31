/* istanbul ignore file */
import { SubmissionItemNode, SubmissionItemNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';
import { userFactory } from '../user.factory';

export const submissionItemNodeFactory = BaseFactory.define<SubmissionItemNode, SubmissionItemNodeProps>(
	SubmissionItemNode,
	() => {
		const creator = userFactory.build();

		return {
			completed: false,
			userId: creator.id,
		};
	}
);
