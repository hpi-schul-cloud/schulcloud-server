import { Factory } from 'fishery';
import { SchulconnexLizenzInfoActionType, SchulconnexLizenzInfoResponse } from '../response';

export const schulconnexLizenzInfoResponseFactory = Factory.define<SchulconnexLizenzInfoResponse>(() => {
	return {
		target: {
			uid: 'bildungscloud',
			partOf: '',
		},
		permission: [
			{
				action: [SchulconnexLizenzInfoActionType.EXECUTE],
			},
		],
	};
});
