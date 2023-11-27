import { ShareTokenInfoResponse } from '../controller/dto';
import { ShareTokenInfoDto } from '../uc/dto';

export class ShareTokenInfoResponseMapper {
	static mapToResponse(shareTokenInfo: ShareTokenInfoDto): ShareTokenInfoResponse {
		const dto = new ShareTokenInfoResponse({
			token: shareTokenInfo.token,
			parentType: shareTokenInfo.parentType,
			parentName: shareTokenInfo.parentName,
		});

		return dto;
	}
}
