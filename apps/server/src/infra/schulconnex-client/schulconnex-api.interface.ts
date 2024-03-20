import { SchulconnexPersonenInfoParams } from './request';
import { SanisResponse } from './response';

export interface SchulconnexApiInterface {
	getPersonInfo(accessToken: string, options?: { overrideUrl: string }): Promise<SanisResponse>;

	getPersonenInfo(params: SchulconnexPersonenInfoParams): Promise<SanisResponse[]>;
}
