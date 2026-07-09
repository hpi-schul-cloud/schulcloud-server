import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MaintenanceStatusResponse {
	@ApiProperty()
	active: boolean;

	@ApiPropertyOptional()
	startDate?: Date;

	constructor(props: MaintenanceStatusResponse) {
		this.active = props.active;
		this.startDate = props.startDate;
	}
}
