import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { IsEnum, IsMongoId } from 'class-validator';
import { ToolContextType } from '../../../../common/enum';

export class ContextRefParams {
	@IsEnum(ToolContextType)
	@ApiProperty({ type: ToolContextType })
	contextType!: ToolContextType;

	@IsMongoId()
	@ApiProperty()
	contextId!: EntityId;
}
