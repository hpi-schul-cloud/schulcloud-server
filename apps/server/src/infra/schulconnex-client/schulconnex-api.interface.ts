import { type SchulconnexPersonenInfoParams } from './request';
import { type SchulconnexPoliciesInfoResponse, type SchulconnexResponse } from './response';

export interface SchulconnexApiInterface {
	getPersonInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SchulconnexResponse>;

	getPersonenInfo(params: SchulconnexPersonenInfoParams): Promise<SchulconnexResponse[]>;

	getPoliciesInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SchulconnexPoliciesInfoResponse>;
}
