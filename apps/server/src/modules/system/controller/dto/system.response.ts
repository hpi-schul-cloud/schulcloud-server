import { OauthConfigResponse } from '@src/modules/system/controller/dto/oauth-config.response';
import { ApiProperty } from '@nestjs/swagger';

export class SystemResponse {
	@ApiProperty({
		description: 'Flag to request only systems with oauth-config.',
		required: false,
		nullable: true,
	})
	type: string;

	@ApiProperty({
		description: 'Url of the system.',
		required: false,
		nullable: true,
	})
	url?: string;

	@ApiProperty({
		description: 'Alias of the system.',
		required: false,
		nullable: true,
	})
	alias?: string;

	@ApiProperty({
		description: 'Oauth config of the system.',
		type: OauthConfigResponse,
		required: false,
		nullable: true,
	})
	oauthConfig?: OauthConfigResponse;

	constructor(system: SystemResponse) {
		this.type = system.type;
		this.url = system.url;
		this.alias = system.alias;
		this.oauthConfig = system.oauthConfig;
	}
}
