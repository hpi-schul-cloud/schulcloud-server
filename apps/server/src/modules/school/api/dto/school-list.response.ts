import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';

export class SchoolItemResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public name: string;

	constructor(props: SchoolItemResponse) {
		this.id = props.id;
		this.name = props.name;
	}
}

export class SchoolListResponse extends PaginationResponse<SchoolItemResponse[]> {
	@ApiProperty({ type: [SchoolItemResponse] })
	public data: SchoolItemResponse[];

	constructor(data: SchoolItemResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}
}
