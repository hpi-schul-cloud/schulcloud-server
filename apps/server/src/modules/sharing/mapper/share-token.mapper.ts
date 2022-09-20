import { ShareToken } from '@shared/domain';
import { ShareTokenResponse } from '../controller/dto';

export class ShareTokenMapper {
	static mapToResponse(shareToken: ShareToken): ShareTokenResponse {
		const dto = new ShareTokenResponse({
			token: shareToken.token,
			parentType: shareToken.parentType,
			parentId: shareToken.parentId,
			expiresAt: shareToken.expiresAt,
		});

		return dto;
	}
}
