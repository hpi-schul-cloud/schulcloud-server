import { PaginationResponse } from '@shared/controller';
import { LtiToolResponse } from '@src/modules/tool/controller/dto/response/lti-tool.response';
import { ApiProperty } from '@nestjs/swagger';

export class LtiToolSearchListResponse extends PaginationResponse<LtiToolResponse[]> {
	@ApiProperty({ type: [LtiToolResponse] })
	data: LtiToolResponse[];

	constructor(data: LtiToolResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}
}
