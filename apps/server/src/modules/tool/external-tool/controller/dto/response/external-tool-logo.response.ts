import { ApiProperty } from '@nestjs/swagger';

export class ExternalToolLogoResponse {
	@ApiProperty({ type: 'string', format: 'binary' })
	logoBase64: string;

	constructor(response: ExternalToolLogoResponse) {
		this.logoBase64 = response.logoBase64;
	}
}
