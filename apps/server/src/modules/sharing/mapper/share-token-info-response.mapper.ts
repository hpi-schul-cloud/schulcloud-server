import { ShareTokenInfoResponse } from '../controller/dto/share-token-info.reponse';
import { ShareTokenInfoDto } from '../uc/dto/share-token-info.dto';

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
