import { ApiProperty } from '@nestjs/swagger';
import { MaintenanceStatusResponse } from './maintenance-status.response';
import { SchoolYearResponse } from './school-year.response';

export class MaintenanceResponse {
	@ApiProperty()
	schoolUsesLdap: boolean;

	@ApiProperty()
	maintenance: MaintenanceStatusResponse;

	@ApiProperty()
	currentYear: SchoolYearResponse;

	@ApiProperty()
	nextYear: SchoolYearResponse;

	constructor(props: MaintenanceResponse) {
		this.schoolUsesLdap = props.schoolUsesLdap;
		this.maintenance = props.maintenance;
		this.currentYear = props.currentYear;
		this.nextYear = props.nextYear;
	}
}
