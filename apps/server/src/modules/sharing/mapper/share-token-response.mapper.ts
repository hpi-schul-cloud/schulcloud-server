import { ShareTokenResponse } from '../controller/dto/share-token.response';
import { ShareTokenDO } from '../domainobject/share-token.do';

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
