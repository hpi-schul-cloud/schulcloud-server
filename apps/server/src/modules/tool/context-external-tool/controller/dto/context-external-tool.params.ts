import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ToolContextType } from '../../../common/enum';

export class ContextExternalToolParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	contextExternalToolId!: string;

	@ApiProperty()
	contextId!: string;

	@ApiProperty()
	contextType!: ToolContextType;
}
