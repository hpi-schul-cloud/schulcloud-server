import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types/entity-id';
import { ToolContextType } from '@src/modules/tool/common/enum/tool-context-type.enum';

import { IsEnum, IsMongoId } from 'class-validator';

export class ContextRefParams {
	@IsEnum(ToolContextType)
	@ApiProperty({ type: ToolContextType })
	contextType!: ToolContextType;

	@IsMongoId()
	@ApiProperty()
	contextId!: EntityId;
}
