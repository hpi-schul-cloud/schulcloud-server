import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { ExternalToolResponse } from './external-tool.response';

export class ExternalToolSearchListResponse extends PaginationResponse<ExternalToolResponse[]> {
	@ApiProperty({ type: [ExternalToolResponse] })
	public data: ExternalToolResponse[];

	constructor(data: ExternalToolResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}
}
