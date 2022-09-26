import { ApiProperty } from '@nestjs/swagger';
import { ShareTokenParentType } from '@shared/domain';
import { IsDate, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ShareTokenContextBodyParams } from './share-token-context.body.params';

export class ShareTokenBodyParams {
	@IsEnum(ShareTokenParentType)
	@ApiProperty({ description: 'the type of the object being shared', required: true, nullable: false })
	parentType!: ShareTokenParentType;

	@IsMongoId()
	@ApiProperty({
		description: 'the id of the object being shared.',
		required: true,
		nullable: false,
	})
	parentId!: string;

	@IsDate()
	@IsOptional()
	@ApiProperty({
		description: 'when defined, the sharetoken will expire at this time.',
		required: false,
		nullable: true,
	})
	expiresAt?: Date;

	@IsOptional()
	@ApiProperty({
		description:
			'when defined, the sharetoken will be usable exclusively by members of this context. For example, when passing a school, only users in the school will be able to use the sharetoken.',
		type: ShareTokenContextBodyParams,
		required: false,
		nullable: true,
	})
	context?: ShareTokenContextBodyParams;
}
