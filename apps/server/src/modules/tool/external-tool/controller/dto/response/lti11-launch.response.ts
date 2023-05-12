import { ApiProperty } from '@nestjs/swagger';

export class Lti11LaunchResponse {
	@ApiProperty()
	oauth_signature: string;

	@ApiProperty()
	oauth_consumer_key: string;

	@ApiProperty()
	oauth_nonce: string;

	@ApiProperty()
	oauth_signature_method: string;

	@ApiProperty()
	oauth_timestamp: number;

	@ApiProperty()
	oauth_version: string;

	@ApiProperty({ required: false })
	oauth_token?: string;

	@ApiProperty({ required: false })
	oauth_body_hash?: string;

	constructor(response: Lti11LaunchResponse) {
		this.oauth_signature = response.oauth_signature;
		this.oauth_consumer_key = response.oauth_consumer_key;
		this.oauth_nonce = response.oauth_nonce;
		this.oauth_signature_method = response.oauth_signature_method;
		this.oauth_timestamp = response.oauth_timestamp;
		this.oauth_version = response.oauth_version;
		this.oauth_token = response.oauth_token;
		this.oauth_body_hash = response.oauth_body_hash;
	}
}
