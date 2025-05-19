import { School, SchoolYear } from '../../domain';
import { MaintenanceResponse, MaintenanceStatusResponse } from '../dto';
import { SchoolYearResponseMapper } from './school-year.response.mapper';

export class MaintenanceResponseMapper {
	public static mapToResponse(
		school: School,
		schoolUsesLdap: boolean,
		activeYear: SchoolYear,
		nextYear: SchoolYear
	): MaintenanceResponse {
		const response: MaintenanceResponse = new MaintenanceResponse({
			schoolUsesLdap,
			maintenance: new MaintenanceStatusResponse({
				active: school.isInMaintenance(),
				startDate: school.inMaintenanceSince,
			}),
			currentYear: SchoolYearResponseMapper.mapToResponse(activeYear),
			nextYear: SchoolYearResponseMapper.mapToResponse(nextYear),
		});

		return response;
	}
}
