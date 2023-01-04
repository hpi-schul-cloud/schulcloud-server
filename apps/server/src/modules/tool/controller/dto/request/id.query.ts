import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain';
import { IsMongoId } from 'class-validator';

export class IdQuery {
	@IsMongoId()
	@ApiProperty()
	id!: EntityId;
}
