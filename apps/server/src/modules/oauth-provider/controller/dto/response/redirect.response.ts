import { ApiProperty } from '@nestjs/swagger';

export class RedirectResponse {
	constructor(redirect_to: string) {
		this.redirect_to = redirect_to;
	}

	@ApiProperty()
	redirect_to: string;
}
