import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain';
import { IsMongoId } from 'class-validator';

export class IdParams {
	@IsMongoId()
	@ApiProperty()
	id!: EntityId;
}
