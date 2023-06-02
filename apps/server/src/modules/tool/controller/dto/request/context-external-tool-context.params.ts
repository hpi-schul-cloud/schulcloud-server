import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';
import { ToolContextType } from '../../../interface';

export class ContextExternalToolContextParams {
	@ApiProperty({ nullable: false, required: true })
	@IsMongoId()
	contextId!: string;

	@IsEnum(ToolContextType)
	@ApiProperty({ nullable: false, required: true })
	contextType!: ToolContextType;
}
