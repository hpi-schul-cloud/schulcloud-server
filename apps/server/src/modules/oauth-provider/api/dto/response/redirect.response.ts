import { ApiProperty } from '@nestjs/swagger';

export class RedirectResponse {
	constructor(redirectReponse: RedirectResponse) {
		this.redirect_to = redirectReponse.redirect_to;
	}

	@ApiProperty({
		description:
			'RedirectURL is the URL which you should redirect the user to once the authentication process is completed.',
	})
	redirect_to: string;
}
