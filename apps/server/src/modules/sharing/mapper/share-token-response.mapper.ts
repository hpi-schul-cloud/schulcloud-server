import { ShareTokenDO } from '../domainobject/share-token.do';
import { ShareTokenResponse } from '../api/dto';

export class ShareTokenResponseMapper {
	static mapToResponse(shareToken: ShareTokenDO): ShareTokenResponse {
		const dto = new ShareTokenResponse({
			token: shareToken.token,
			payload: shareToken.payload,
			expiresAt: shareToken.expiresAt,
		});

		return dto;
	}
}
