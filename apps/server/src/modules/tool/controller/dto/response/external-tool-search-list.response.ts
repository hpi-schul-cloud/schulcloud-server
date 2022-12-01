import { PaginationResponse } from '@shared/controller';
import { ApiProperty } from '@nestjs/swagger';
import { ExternalToolResponse } from '@src/modules/tool/controller/dto/response/external-tool.response';

export class ExternalToolSearchListResponse extends PaginationResponse<ExternalToolResponse[]> {
	@ApiProperty({ type: [ExternalToolResponse] })
	data: ExternalToolResponse[];

	constructor(data: ExternalToolResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}
}
