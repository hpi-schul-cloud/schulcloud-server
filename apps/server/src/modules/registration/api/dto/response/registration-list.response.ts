import { ApiProperty } from '@nestjs/swagger';
import { RegistrationItemResponse } from './registration-item.response';

export class RegistrationListResponse {
	constructor({ data }: RegistrationListResponse) {
		this.data = data;
	}

	@ApiProperty({ type: [RegistrationItemResponse] })
	public data: RegistrationItemResponse[];
}
