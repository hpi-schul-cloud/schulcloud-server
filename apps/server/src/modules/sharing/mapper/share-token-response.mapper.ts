import { type ShareTokenDO } from '../domainobject/share-token.do';
import { ShareTokenResponse } from '../api/dto';

export class ShareTokenResponseMapper {
	public static mapToResponse(shareToken: ShareTokenDO): ShareTokenResponse {
		const dto = new ShareTokenResponse({
			token: shareToken.token,
			payload: shareToken.payload,
			expiresAt: shareToken.expiresAt,
		});

		return dto;
	}
}
