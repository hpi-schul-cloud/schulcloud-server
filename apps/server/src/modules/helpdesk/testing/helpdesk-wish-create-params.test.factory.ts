import { HelpdeskWishCreateParams } from '../api/dto/helpdesk-problem-create.params';
import { SupportType } from '../domain/type/helpdesk-problem.type';

export class HelpdeskWishCreateParamsFactory {
	public static create(overrides: Partial<HelpdeskWishCreateParams> = {}): HelpdeskWishCreateParams {
		return {
			supportType: SupportType.WISH,
			subject: 'Default Wish Subject',
			replyEmail: 'user@example.com',
			problemArea: ['Feature', 'Usability'],
			role: 'teacher',
			desire: 'A new feature',
			benefit: 'It helps teaching',
			...overrides,
		};
	}
}
