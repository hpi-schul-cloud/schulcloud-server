import { Factory } from 'fishery';
import { SchulconnexPoliciesInfoActionType, SchulconnexPoliciesInfoResponse } from '../response';

export const schulconnexPoliciesInfoResponseFactory = Factory.define<SchulconnexPoliciesInfoResponse>(() => {
	return {
		target: {
			uid: 'bildungscloud',
			partOf: '',
		},
		permission: [
			{
				action: [SchulconnexPoliciesInfoActionType.EXECUTE],
			},
		],
	};
});
