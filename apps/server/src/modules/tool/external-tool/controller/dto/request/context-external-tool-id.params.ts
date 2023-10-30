import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types/entity-id';

import { IsMongoId } from 'class-validator';

export class ContextExternalToolIdParams {
	@IsMongoId()
	@ApiProperty()
	contextExternalToolId!: EntityId;
}
