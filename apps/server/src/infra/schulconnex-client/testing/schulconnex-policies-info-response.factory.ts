import { Factory } from 'fishery';
import {
	SchulconnexPoliciesInfoActionType,
	SchulconnexPoliciesInfoErrorResponse,
	SchulconnexPoliciesInfoLicenseResponse,
	SchulconnexPoliciesInfoResponse,
} from '../response';

export const schulconnexPoliciesInfoLicenseResponseFactory = Factory.define<SchulconnexPoliciesInfoLicenseResponse>(
	() => {
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
	}
);

export const schulconnexPoliciesInfoErrorResponseFactory = Factory.define<SchulconnexPoliciesInfoErrorResponse>(() => {
	return {
		access_control: {
			'@type': 'bilo error mock',
			error: {
				code: '500',
				value: 'something went wrong',
			},
		},
	};
});

export const schulconnexPoliciesInfoResponseFactory = Factory.define<SchulconnexPoliciesInfoResponse>(() => {
	return {
		data: [schulconnexPoliciesInfoLicenseResponseFactory.build(), schulconnexPoliciesInfoErrorResponseFactory.build()],
	};
});
