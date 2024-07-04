import { SchulconnexPersonenInfoParams } from './request';
import { SchulconnexLizenzInfoResponse, SchulconnexResponse } from './response';

export interface SchulconnexApiInterface {
	getPersonInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SchulconnexResponse>;

	getPersonenInfo(params: SchulconnexPersonenInfoParams): Promise<SchulconnexResponse[]>;

	getLizenzInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SchulconnexLizenzInfoResponse[]>;
}
