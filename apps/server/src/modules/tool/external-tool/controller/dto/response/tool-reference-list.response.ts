import { ApiProperty } from '@nestjs/swagger';
import { ToolReferenceResponse } from './tool-reference.response';

export class ToolReferenceListResponse {
	@ApiProperty({ type: [ToolReferenceResponse] })
	data: ToolReferenceResponse[];

	constructor(data: ToolReferenceResponse[]) {
		this.data = data;
	}
}
