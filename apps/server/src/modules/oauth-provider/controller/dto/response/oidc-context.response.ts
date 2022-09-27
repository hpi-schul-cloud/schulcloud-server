import { ApiProperty } from '@nestjs/swagger';

export class OidcContextResponse {
	@ApiProperty()
	acr_values?: string[];

	@ApiProperty()
	display?: string;

	@ApiProperty()
	id_token_hint_claims?: object;

	@ApiProperty()
	login_hint?: string;

	@ApiProperty()
	ui_locales?: string[];
}
