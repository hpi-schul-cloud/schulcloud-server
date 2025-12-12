import { HelpdeskProblemProps } from '../domain/interface';
import { SupportType } from '../domain/type';

export const helpdeskProblemPropsFactory = {
	create: (props?: Partial<HelpdeskProblemProps>): HelpdeskProblemProps => {
		return {
			supportType: SupportType.PROBLEM,
			subject: 'Test Problem Subject',
			replyEmail: 'test@example.com',
			problemArea: ['General'],
			problemDescription: 'Test problem description',
			device: 'Desktop',
			consent: true,
			...props,
		};
	},
};
