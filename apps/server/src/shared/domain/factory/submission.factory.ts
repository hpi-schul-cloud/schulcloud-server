import { BaseFactory } from './base.factory';
import { Submission, ISubmissionProperties } from '../entity/submission.entity';
import { taskFactory } from './task.factory';
import { userFactory } from './user.factory';

export const submissionFactory = BaseFactory.define<Submission, ISubmissionProperties>(Submission, () => {
	return {
		task: taskFactory.build(),
		student: userFactory.build(),
		comment: 'submission comment',
	};
});
