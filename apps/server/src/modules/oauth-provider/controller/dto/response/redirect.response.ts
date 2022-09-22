import { ApiProperty } from '@nestjs/swagger';

export class RedirectResponse {
	constructor(redirectReponse: RedirectResponse) {
		this.redirect_to = redirectReponse.redirect_to;
	}

	@ApiProperty()
	redirect_to: string;
}
