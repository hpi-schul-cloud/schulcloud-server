import { SystemResponse } from '@src/modules/system/controller/dto/system.response';

export class SystemOauthResponse {
	constructor(systemResponses: SystemResponse[]) {
		this.data = systemResponses;
	}

	data: SystemResponse[];
}
