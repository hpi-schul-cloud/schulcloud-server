import { ApiProperty } from '@nestjs/swagger';
import { Optional } from '@nestjs/common';

export class OidcContextResponse {
	@ApiProperty()
	acr_values?: string[];

	@ApiProperty()
	display?: string;

	@ApiProperty()
	id_token_hint_claims?: object;

	@ApiProperty()
	login_hint?: string;

	@Optional()
	@ApiProperty()
	ui_locales?: string[];
}
