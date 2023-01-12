import { ApiProperty } from '@nestjs/swagger';
import { ToolConfigurationEntryResponse } from './tool-configuration-entry.response';

export class ToolConfigurationListResponse {
	@ApiProperty()
	data: ToolConfigurationEntryResponse[];

	constructor(data: ToolConfigurationEntryResponse[]) {
		this.data = data;
	}
}
