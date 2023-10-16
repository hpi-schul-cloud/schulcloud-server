import { ApiPropertyOptional } from '@nestjs/swagger';
import { LoginResponse } from './login.response';

export class OauthLoginResponse extends LoginResponse {
	@ApiPropertyOptional({
		description:
			'The external id token which is from the external oauth system and set when scope openid is available.',
	})
	externalIdToken?: string;

	constructor(props: OauthLoginResponse) {
		super(props);
		this.externalIdToken = props.externalIdToken;
	}
}
