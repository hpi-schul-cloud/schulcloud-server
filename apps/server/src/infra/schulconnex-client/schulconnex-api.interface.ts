import { SchulconnexPersonenInfoParams } from './request';
import { SanisResponse, SchulconnexLizenzInfoResponse } from './response';

export interface SchulconnexApiInterface {
	getPersonInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SanisResponse>;

	getPersonenInfo(params: SchulconnexPersonenInfoParams): Promise<SanisResponse[]>;

	getLizenzInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SchulconnexLizenzInfoResponse[]>;
}
