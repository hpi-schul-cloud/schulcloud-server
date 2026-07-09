import { ShareTokenInfoResponse } from '../api/dto';
import { type ShareTokenInfoDto } from '../api/dto';

export class ShareTokenInfoResponseMapper {
	public static mapToResponse(shareTokenInfo: ShareTokenInfoDto): ShareTokenInfoResponse {
		const dto = new ShareTokenInfoResponse({
			token: shareTokenInfo.token,
			parentType: shareTokenInfo.parentType,
			parentName: shareTokenInfo.parentName,
		});

		return dto;
	}
}
