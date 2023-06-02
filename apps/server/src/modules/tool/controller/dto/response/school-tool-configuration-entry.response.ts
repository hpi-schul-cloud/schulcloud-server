import { ApiProperty } from '@nestjs/swagger';
import { ToolConfigurationEntryResponse } from './tool-configuration-entry.response';

export class SchoolToolConfigurationEntryResponse extends ToolConfigurationEntryResponse {
	@ApiProperty()
	schoolToolId: string;

	constructor(response: ToolConfigurationEntryResponse, schoolToolId: string) {
		super(response);
		this.schoolToolId = schoolToolId;
	}
}
