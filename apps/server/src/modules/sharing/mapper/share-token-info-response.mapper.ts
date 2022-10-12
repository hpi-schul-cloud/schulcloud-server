import { ShareTokenParentType } from '@shared/domain';
import { ShareTokenInfoResponse } from '../controller/dto';

export class ShareTokenInfoResponseMapper {
	static mapToResponse(shareTokenInfo: {
		parentType: ShareTokenParentType;
		parentName: string;
	}): ShareTokenInfoResponse {
		const dto = new ShareTokenInfoResponse({
			parentType: shareTokenInfo.parentType,
			parentName: shareTokenInfo.parentName,
		});

		return dto;
	}
}
