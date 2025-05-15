import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MaintenanceStatusResponse {
	@ApiProperty()
	public active: boolean;

	@ApiPropertyOptional()
	public startDate?: Date;

	constructor(props: MaintenanceStatusResponse) {
		this.active = props.active;
		this.startDate = props.startDate;
	}
}
