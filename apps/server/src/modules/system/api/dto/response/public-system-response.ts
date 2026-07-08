import { ApiProperty } from '@nestjs/swagger';
import { OauthConfigResponse } from './oauth-config.response';

export class PublicSystemResponse {
	@ApiProperty({
		description: 'Id of the system.',
		required: true,
		nullable: false,
	})
	public id: string;

	@ApiProperty({
		description: 'Flag to request only systems with oauth-config.',
		required: false,
		nullable: true,
	})
	public type: string;

	@ApiProperty({
		description: 'Alias of the system.',
		required: false,
		nullable: true,
	})
	public alias?: string;

	@ApiProperty({
		description: 'Display name of the system.',
		required: false,
		nullable: true,
	})
	public displayName?: string;

	@ApiProperty({
		description: 'Oauth config of the system.',
		type: OauthConfigResponse,
		required: false,
		nullable: true,
	})
	public oauthConfig?: OauthConfigResponse;

	constructor(system: PublicSystemResponse) {
		this.id = system.id;
		this.type = system.type;
		this.alias = system.alias;
		this.displayName = system.displayName;
		this.oauthConfig = system.oauthConfig;
	}
}
