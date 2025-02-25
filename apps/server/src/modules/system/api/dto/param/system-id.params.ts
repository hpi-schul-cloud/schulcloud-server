import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { IsMongoId } from 'class-validator';

export class SystemIdParams {
	@IsMongoId()
	@ApiProperty()
	systemId!: EntityId;
}
