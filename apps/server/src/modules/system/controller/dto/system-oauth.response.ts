import { SystemResponse } from '@src/modules/system/controller/dto/system.response';

export class SystemOauthResponse {
	data: SystemResponse[];

	constructor(systemResponses: SystemResponse[]) {
		this.data = systemResponses;
	}
}
