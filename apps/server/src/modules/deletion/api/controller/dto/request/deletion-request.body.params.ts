import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { EntityId } from '@shared/domain/types';
import { DeletionTargetRef } from '../../../../domain/interface';
import { DomainName } from '../../../../domain/types';

export class DeletionTargetRefProps implements DeletionTargetRef {
	@IsEnum(DomainName)
	@ApiProperty({
		enum: DomainName,
		enumName: 'DomainName',
		description: 'The domain of the entity to be deleted',
	})
	public domain!: DomainName;

	@IsMongoId()
	@ApiProperty()
	public id!: EntityId;
}

export class DeletionRequestBodyParams {
	@ValidateNested()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	public targetRef!: DeletionTargetRefProps;

	@IsNumber()
	@Min(0)
	@IsOptional()
	@ApiPropertyOptional({
		nullable: false,
	})
	public deleteAfterMinutes?: number;
}
