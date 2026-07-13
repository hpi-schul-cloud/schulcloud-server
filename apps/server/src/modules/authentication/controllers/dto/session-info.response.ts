import { ApiProperty } from '@nestjs/swagger';

export class SessionInfoResponse {
	@ApiProperty()
	expiresInSeconds: number;

	constructor(expiresInSeconds: number) {
		this.expiresInSeconds = expiresInSeconds;
	}
}
