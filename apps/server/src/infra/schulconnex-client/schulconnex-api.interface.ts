import { SchulconnexPersonenInfoParams } from './request';
import { SchulconnexPoliciesInfoResponse, SchulconnexResponse } from './response';

export interface SchulconnexApiInterface {
	getPersonInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SchulconnexResponse>;

	getPersonenInfo(params: SchulconnexPersonenInfoParams): Promise<SchulconnexResponse[]>;

	getPoliciesInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SchulconnexPoliciesInfoResponse[]>;
}
