import { ApiProperty } from '@nestjs/swagger';
import { ToolContextType } from '../../../../common/enum';

export class ToolContextTypesList {
	@ApiProperty({ type: [ToolContextType] })
	data: ToolContextType[];

	constructor(data: ToolContextType[]) {
		this.data = data;
	}
}
