import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { IsMongoId } from 'class-validator';

export class SchoolSystemParams {
	@IsMongoId()
	@ApiProperty()
	schoolId!: EntityId;

	@IsMongoId()
	@ApiProperty()
	systemId!: EntityId;
}
