import { ApiProperty } from '@nestjs/swagger';
import { ShareTokenParentType } from '@shared/domain';

export class ShareTokenInfoResponse {
	constructor({ token, parentType, parentName }: ShareTokenInfoResponse) {
		this.token = token;
		this.parentType = parentType;
		this.parentName = parentName;
	}

	@ApiProperty()
	token: string;

	@ApiProperty({ enum: ShareTokenParentType })
	parentType: ShareTokenParentType;

	@ApiProperty()
	parentName: string;
}
