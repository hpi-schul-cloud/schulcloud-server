import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShareTokenParentType } from '@shared/domain';

export class ShareTokenResponse {
	constructor({ token, parentType, parentId, expiresAt }: ShareTokenResponse) {
		this.token = token;
		this.parentType = parentType;
		this.parentId = parentId;
		this.expiresAt = expiresAt;
	}

	@ApiProperty()
	token: string;

	@ApiProperty({ enum: ShareTokenParentType })
	parentType: ShareTokenParentType;

	@ApiProperty()
	parentId: string;

	@ApiPropertyOptional()
	expiresAt?: Date;
}
