import { ApiProperty } from '@nestjs/swagger';
import { SchoolExternalToolResponse } from './school-external-tool.response';

export class SchoolExternalToolListResponse {
	@ApiProperty()
	data: SchoolExternalToolResponse[];

	constructor(data: SchoolExternalToolResponse[]) {
		this.data = data;
	}
}
