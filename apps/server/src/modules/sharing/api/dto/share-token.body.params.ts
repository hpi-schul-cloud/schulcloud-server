import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsMongoId, IsOptional, IsPositive } from 'class-validator';
import { ShareTokenParentType } from '../../domainobject/share-token.do';

export class ShareTokenBodyParams {
	@IsEnum(ShareTokenParentType)
	@ApiProperty({
		description: 'the type of the object being shared',
		required: true,
		nullable: false,
		enum: ShareTokenParentType,
	})
	parentType!: ShareTokenParentType;

	@IsMongoId()
	@ApiProperty({
		description: 'the id of the object being shared.',
		required: true,
		nullable: false,
	})
	parentId!: string;

	@IsInt()
	@IsOptional()
	@IsPositive()
	@ApiPropertyOptional({
		description: 'when defined, the sharetoken will expire after the given number of days.',
		required: false,
		nullable: true,
		minimum: 1,
	})
	expiresInDays?: number;

	@IsBoolean()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'when defined, the sharetoken will be usable exclusively by members of the users school.',
		required: false,
		nullable: true,
	})
	schoolExclusive?: boolean;
}
