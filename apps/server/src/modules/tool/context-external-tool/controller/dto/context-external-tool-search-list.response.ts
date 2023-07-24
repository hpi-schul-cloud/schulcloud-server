import { ApiProperty } from '@nestjs/swagger';
import { ContextExternalToolResponse } from './context-external-tool.response';

export class ContextExternalToolSearchListResponse {
	@ApiProperty({ type: [ContextExternalToolResponse] })
	data: ContextExternalToolResponse[];

	constructor(data: ContextExternalToolResponse[]) {
		this.data = data;
	}
}
