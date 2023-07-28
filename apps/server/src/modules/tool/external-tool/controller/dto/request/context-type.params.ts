import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ToolContextType } from '../../../../common/enum';

export class ContextTypeParams {
	@IsEnum(ToolContextType)
	@ApiProperty({ type: ToolContextType })
	context!: ToolContextType;
}
