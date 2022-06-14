import { ApiProperty } from '@nestjs/swagger';
import { OauthConfigResponse } from '@src/modules/system/controller/dto/oauth-config.response';

export class OauthResponse {
	constructor(oauthConfigResponses: OauthConfigResponse[]) {
		this.data = oauthConfigResponses;
	}

	@ApiProperty()
	data: OauthConfigResponse[];
}
