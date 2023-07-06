/* istanbul ignore file */
import { SubmissionBoardNode, SubmissionBoardNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';
import { userFactory } from '../user.factory';

export const submissionBoardNodeFactory = BaseFactory.define<SubmissionBoardNode, SubmissionBoardNodeProps>(
	SubmissionBoardNode,
	() => {
		const creator = userFactory.build();

		return {
			completed: false,
			userId: creator.id,
		};
	}
);
