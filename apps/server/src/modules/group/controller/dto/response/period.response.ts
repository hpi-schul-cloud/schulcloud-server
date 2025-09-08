import { ApiProperty } from '@nestjs/swagger';

export class PeriodResponse {
	@ApiProperty()
	from: Date;

	@ApiProperty()
	until: Date;

	constructor(props: PeriodResponse) {
		this.from = props.from;
		this.until = props.until;
	}
}
