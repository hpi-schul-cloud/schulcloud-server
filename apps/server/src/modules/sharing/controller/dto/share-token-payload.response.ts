import { ApiProperty } from '@nestjs/swagger';
import { ShareTokenParentType, ShareTokenPayload } from '@shared/domain';

export class ShareTokenPayloadResponse {
	constructor(payload: ShareTokenPayload) {
		this.parentType = payload.parentType;
		this.parentId = payload.parentId;
	}

	@ApiProperty({ enum: ShareTokenParentType })
	parentType: ShareTokenParentType;

	@ApiProperty()
	parentId: string;
}
