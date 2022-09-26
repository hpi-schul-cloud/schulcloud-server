import { ShareTokenDO } from '@shared/domain';
import { ShareTokenResponse } from '../controller/dto';

export class ShareTokenMapper {
	static mapToResponse(shareToken: ShareTokenDO): ShareTokenResponse {
		const dto = new ShareTokenResponse({
			token: shareToken.token,
			payload: shareToken.payload,
			expiresAt: shareToken.expiresAt,
		});

		return dto;
	}
}
