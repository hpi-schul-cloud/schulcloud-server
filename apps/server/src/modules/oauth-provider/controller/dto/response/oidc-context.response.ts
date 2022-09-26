import { ApiProperty } from '@nestjs/swagger';
import { Optional } from '@nestjs/common';

export class OidcContextResponse {
	@Optional()
	@ApiProperty()
	acr_values?: string[];

	@Optional()
	@ApiProperty()
	display?: string;

	@Optional()
	@ApiProperty()
	id_token_hint_claims?: object;

	@Optional()
	@ApiProperty()
	login_hint?: string;

	@Optional()
	@ApiProperty()
	ui_locales?: string[];
}
