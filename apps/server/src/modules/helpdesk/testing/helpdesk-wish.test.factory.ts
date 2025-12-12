import { HelpdeskWishProps } from '../domain/interface';
import { SupportType } from '../domain/type';

export const helpdeskWishPropsFactory = {
	create: (props?: Partial<HelpdeskWishProps>): HelpdeskWishProps => {
		return {
			supportType: SupportType.WISH,
			subject: 'Test Wish Subject',
			replyEmail: 'test@example.com',
			problemArea: ['General'],
			role: 'As a user',
			desire: 'I want to test',
			benefit: 'So I can verify functionality',
			acceptanceCriteria: 'Feature works as expected',
			consent: true,
			...props,
		};
	},
};
