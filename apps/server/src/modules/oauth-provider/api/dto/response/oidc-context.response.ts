import { ApiProperty } from '@nestjs/swagger';

export class OidcContextResponse {
	constructor(props: OidcContextResponse) {
		this.acr_values = props.acr_values;
		this.display = props.display;
		this.id_token_hint_claims = props.id_token_hint_claims;
		this.login_hint = props.login_hint;
		this.ui_locales = props.ui_locales;
	}

	@ApiProperty()
	acr_values: string[];

	@ApiProperty()
	display: string;

	@ApiProperty()
	id_token_hint_claims: object;

	@ApiProperty()
	login_hint: string;

	@ApiProperty()
	ui_locales: string[];
}
