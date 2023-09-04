import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain';
import { IsMongoId } from 'class-validator';

export class ContextExternalToolIdParams {
	@IsMongoId()
	@ApiProperty()
	contextExternalToolId!: EntityId;
}
