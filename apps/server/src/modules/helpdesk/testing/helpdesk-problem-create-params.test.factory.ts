import { HelpdeskProblemCreateParams } from '../api/dto/helpdesk-problem-create.params';
import { SupportType } from '../domain/type/helpdesk-problem.type';

export class HelpdeskProblemCreateParamsFactory {
	public static create(overrides: Partial<HelpdeskProblemCreateParams> = {}): HelpdeskProblemCreateParams {
		return {
			supportType: SupportType.PROBLEM,
			subject: 'Default Problem Subject',
			replyEmail: 'user@example.com',
			problemArea: ['Login'],
			problemDescription: 'Default problem description',
			...overrides,
		};
	}
}
