import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShareTokenPayloadResponse } from './share-token-payload.response';

export class ShareTokenResponse {
	constructor({ token, payload, expiresAt }: ShareTokenResponse) {
		this.token = token;
		this.payload = new ShareTokenPayloadResponse(payload);
		this.expiresAt = expiresAt;
	}

	@ApiProperty()
	token: string;

	@ApiProperty()
	payload: ShareTokenPayloadResponse;

	@ApiPropertyOptional()
	expiresAt?: Date;
}
