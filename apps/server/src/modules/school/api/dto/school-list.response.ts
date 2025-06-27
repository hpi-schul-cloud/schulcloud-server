import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';

export class SchoolItemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	constructor(props: SchoolItemResponse) {
		this.id = props.id;
		this.name = props.name;
	}
}

export class SchoolListResponse extends PaginationResponse<SchoolItemResponse[]> {
	constructor(data: SchoolItemResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [SchoolItemResponse] })
	public data: SchoolItemResponse[];
}
