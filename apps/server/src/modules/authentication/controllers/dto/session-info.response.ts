import { ApiProperty } from '@nestjs/swagger';

export class SessionInfoResponse {
	@ApiProperty()
	public expiresInSeconds: number;

	constructor(expiresInSeconds: number) {
		this.expiresInSeconds = expiresInSeconds;
	}
}
