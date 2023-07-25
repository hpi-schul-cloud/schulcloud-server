import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';
import { ToolContextType } from '../../../common/interface';

export class ContextExternalToolContextParams {
	@ApiProperty({ nullable: false, required: true, example: '0000dcfbfb5c7a3f00bf21ab' })
	@IsMongoId()
	contextId!: string;

	@IsEnum(ToolContextType)
	@ApiProperty({ nullable: false, required: true, example: ToolContextType.COURSE })
	contextType!: ToolContextType;
}
