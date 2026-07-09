import { ApiProperty } from '@nestjs/swagger';
import { SchoolExternalToolResponse } from './school-external-tool.response';

export class SchoolExternalToolSearchListResponse {
	@ApiProperty({ type: [SchoolExternalToolResponse] })
	data: SchoolExternalToolResponse[];

	constructor(data: SchoolExternalToolResponse[]) {
		this.data = data;
	}
}
