import { ApiProperty } from '@nestjs/swagger';
import { MaintenanceStatusResponse } from './maintenance-status.response';
import { SchoolYearResponse } from './school-year.response';

export class MaintenanceResponse {
	@ApiProperty()
	public schoolUsesLdap: boolean;

	@ApiProperty()
	public maintenance: MaintenanceStatusResponse;

	@ApiProperty()
	public currentYear: SchoolYearResponse;

	@ApiProperty()
	public nextYear: SchoolYearResponse;

	constructor(props: MaintenanceResponse) {
		this.schoolUsesLdap = props.schoolUsesLdap;
		this.maintenance = props.maintenance;
		this.currentYear = props.currentYear;
		this.nextYear = props.nextYear;
	}
}
