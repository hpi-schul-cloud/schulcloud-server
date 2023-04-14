import { ISubmissionProperties, Submission } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { BaseEntityTestFactory } from './base-entity-test.factory';
import { schoolFactory } from './school.factory';
import { taskFactory } from './task.factory';
import { userFactory } from './user.factory';

class SubmissionFactory extends BaseEntityTestFactory<Submission, ISubmissionProperties> {
	graded(): this {
		const params: DeepPartial<ISubmissionProperties> = { graded: true };

		return this.params(params);
	}

	submitted(): this {
		const params: DeepPartial<ISubmissionProperties> = { submitted: true };

		return this.params(params);
	}

	studentWithId(): this {
		const params: DeepPartial<ISubmissionProperties> = { student: userFactory.buildWithId() };

		return this.params(params);
	}

	teamMembersWithId(numberOfTeamMembers: number): this {
		const teamMembers = userFactory.buildListWithId(numberOfTeamMembers);
		const params: DeepPartial<ISubmissionProperties> = { teamMembers };

		return this.params(params);
	}
}

export const submissionFactory = SubmissionFactory.define(Submission, ({ sequence }) => {
	return {
		school: schoolFactory.build(),
		task: taskFactory.build(),
		student: userFactory.build(),
		comment: `submission comment #${sequence}`,
	};
});
