import { ApiProperty } from '@nestjs/swagger';
import { SystemResponse } from '@src/modules/system/controller/dto/system.response';

export class SystemOauthResponse {
	@ApiProperty({ type: [SystemResponse] })
	data: SystemResponse[];

	constructor(systemResponses: SystemResponse[]) {
		this.data = systemResponses;
	}
}
