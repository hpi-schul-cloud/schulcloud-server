import { ApiProperty } from '@nestjs/swagger';
import { ShareTokenParentType } from '@shared/domain';

export class ShareTokenInfoResponse {
	constructor({ parentType, parentName }: ShareTokenInfoResponse) {
		this.parentType = parentType;
		this.parentName = parentName;
	}

	@ApiProperty({ enum: ShareTokenParentType })
	parentType: ShareTokenParentType;

	@ApiProperty()
	parentName: string;
}
