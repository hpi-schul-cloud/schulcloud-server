import { ApiProperty } from '@nestjs/swagger';
import { SchoolToolConfigurationEntryResponse } from './school-tool-configuration-entry.response';

export class SchoolToolConfigurationListResponse {
	@ApiProperty({ type: [SchoolToolConfigurationEntryResponse] })
	data: SchoolToolConfigurationEntryResponse[];

	constructor(data: SchoolToolConfigurationEntryResponse[]) {
		this.data = data;
	}
}
