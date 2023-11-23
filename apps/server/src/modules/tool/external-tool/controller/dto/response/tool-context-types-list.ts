import { ApiProperty } from '@nestjs/swagger';
import { ToolContextType } from '../../../../common/enum';

export class ToolContextTypesList {
	@ApiProperty({ enum: ToolContextType, enumName: 'ToolContextType', isArray: true })
	data: ToolContextType[];

	constructor(data: ToolContextType[]) {
		this.data = data;
	}
}
