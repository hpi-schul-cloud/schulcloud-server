import { Submission, ISubmissionProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { taskFactory } from './task.factory';
import { userFactory } from './user.factory';

export const submissionFactory = BaseFactory.define<Submission, ISubmissionProperties>(Submission, () => {
	return {
		task: taskFactory.build(),
		student: userFactory.build(),
		comment: 'submission comment',
	};
});
