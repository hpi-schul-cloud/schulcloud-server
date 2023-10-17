import { School } from '../do';
import { SchoolDto, SlimSchoolDto } from '../dto';
import { FederalStateMapper } from './federal-state.mapper';
import { SchoolYearMapper } from './school-year.mapper';
import { SystemMapper } from './system.mapper';

export class SchoolMapper {
	public static mapToDto(school: School): SchoolDto {
		const schoolProps = school.getProps();

		const federalState = FederalStateMapper.mapToDto(schoolProps.federalState);
		const currentYear = schoolProps.currentYear && SchoolYearMapper.mapToDto(schoolProps.currentYear);
		const features = schoolProps.features && Array.from(schoolProps.features);
		const systems = schoolProps.systems?.map((system) => SystemMapper.mapToDto(system));

		const dto = new SchoolDto({
			id: school.id,
			name: schoolProps.name,
			officialSchoolNumber: schoolProps.officialSchoolNumber,
			currentYear,
			federalState,
			county: schoolProps.county,
			purpose: schoolProps.purpose,
			features,
			systems,
			inMaintenance: school.isInMaintenance(),
			isExternal: school.isExternal(),
			logo_dataUrl: schoolProps.logo_dataUrl,
		});

		return dto;
	}

	public static mapToListOfSlimDtos(schools: School[]): SlimSchoolDto[] {
		const dtos = schools.map((school) => this.mapToSlimDto(school));

		return dtos;
	}

	public static mapToSlimDto(school: School): SlimSchoolDto {
		const schoolProps = school.getProps();

		const dto = new SlimSchoolDto({
			id: school.id,
			name: schoolProps.name,
			purpose: schoolProps.purpose,
		});

		return dto;
	}
}
