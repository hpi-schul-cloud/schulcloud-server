import { Submission, SubmissionProperties } from '@shared/domain/entity';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import { schoolEntityFactory } from './school-entity.factory';
import { taskFactory } from './task.factory';
import { userFactory } from './user.factory';

class SubmissionFactory extends BaseFactory<Submission, SubmissionProperties> {
	graded(): this {
		const params: DeepPartial<SubmissionProperties> = { graded: true };

		return this.params(params);
	}

	submitted(): this {
		const params: DeepPartial<SubmissionProperties> = { submitted: true };

		return this.params(params);
	}

	studentWithId(): this {
		const params: DeepPartial<SubmissionProperties> = { student: userFactory.buildWithId() };

		return this.params(params);
	}

	teamMembersWithId(numberOfTeamMembers: number): this {
		const teamMembers = userFactory.buildListWithId(numberOfTeamMembers);
		const params: DeepPartial<SubmissionProperties> = { teamMembers };

		return this.params(params);
	}
}

export const submissionFactory = SubmissionFactory.define(Submission, ({ sequence }) => {
	return {
		school: schoolEntityFactory.build(),
		task: taskFactory.build(),
		student: userFactory.build(),
		comment: `submission comment #${sequence}`,
	};
});
