import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { SyncAttribute } from '@shared/domain/entity';

export class CourseSyncBodyParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the group',
		required: true,
		nullable: false,
	})
	groupId!: string;

	@IsArray()
	@IsOptional()
	@IsEnum(SyncAttribute, { each: true })
	@ApiPropertyOptional({
		enum: SyncAttribute,
		enumName: 'SyncAttribute',
		isArray: true,
		description: 'Restrict the course synchronization for certain fields',
	})
	excludedFields?: SyncAttribute[];
}
