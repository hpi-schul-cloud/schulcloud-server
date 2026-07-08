import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { ShareTokenParentType } from '../../domainobject/share-token.do';

export class ShareTokenInfoResponse {
	constructor({ token, parentType, parentName }: ShareTokenInfoResponse) {
		this.token = token;
		this.parentType = parentType;
		this.parentName = parentName;
	}

	@ApiProperty()
	public token: string;

	@ApiProperty({ enum: ShareTokenParentType })
	public parentType: ShareTokenParentType;

	@ApiProperty()
	@DecodeHtmlEntities()
	public parentName: string;
}
