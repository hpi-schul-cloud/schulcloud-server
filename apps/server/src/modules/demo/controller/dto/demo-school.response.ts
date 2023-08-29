import { ApiProperty } from '@nestjs/swagger';

export class DemoSchoolResponse {
	constructor({ id }: DemoSchoolResponse) {
		this.id = id;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
	})
	id: string;
}
