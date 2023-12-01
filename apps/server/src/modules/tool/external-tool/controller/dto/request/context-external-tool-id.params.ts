import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { IsMongoId } from 'class-validator';

export class ContextExternalToolIdParams {
	@IsMongoId()
	@ApiProperty()
	contextExternalToolId!: EntityId;
}
