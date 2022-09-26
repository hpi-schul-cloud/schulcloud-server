import { ApiProperty } from '@nestjs/swagger';
import { ShareTokenContextType, ShareTokenParentType } from '@shared/domain';
import { IsEnum, IsMongoId } from 'class-validator';

export class ShareTokenContextBodyParams {
	@IsEnum(ShareTokenParentType)
	@ApiProperty({ description: 'the type of the authorisation context', required: true, nullable: false })
	contextType!: ShareTokenContextType;

	@IsMongoId()
	@ApiProperty({
		description: 'the id of the authorisation context.',
		required: true,
		nullable: false,
	})
	contextId!: string;
}
