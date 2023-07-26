import { ApiProperty } from '@nestjs/swagger';
import { ToolConfigurationEntryResponse } from '../../../external-tool/controller/dto';

export class SchoolToolConfigurationEntryResponse extends ToolConfigurationEntryResponse {
	@ApiProperty()
	schoolToolId: string;

	constructor(response: ToolConfigurationEntryResponse, schoolToolId: string) {
		super(response);
		this.schoolToolId = schoolToolId;
	}
}
