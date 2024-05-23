import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';
import { ToolContextType } from '../../../common/enum';

export class ContextExternalToolBodyParams {
	@ApiProperty({ example: '0000dcfbfb5c7a3f00bf21ab' })
	@IsMongoId()
	contextId!: string;

	@IsEnum(ToolContextType)
	@ApiProperty({
		enum: ToolContextType,
		enumName: 'ToolContextType',
		example: ToolContextType.MEDIA_BOARD,
	})
	contextType!: ToolContextType;
}
