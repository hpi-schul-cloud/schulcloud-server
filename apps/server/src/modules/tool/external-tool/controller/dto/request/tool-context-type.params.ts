import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ToolContextType } from '@modules/tool/common/enum';

export class ToolContextTypeParams {
	@IsOptional()
	@IsEnum(ToolContextType, { each: true })
	@ApiPropertyOptional({
		enum: ToolContextType,
		enumName: 'ToolContextType',
		description: 'Context types for tools',
	})
	contextType?: ToolContextType;
}
