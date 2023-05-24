import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ToolContextType } from '../../../interface';

export class ContextParams {
	@IsEnum(ToolContextType)
	@ApiProperty({ type: ToolContextType })
	context!: ToolContextType;
}
