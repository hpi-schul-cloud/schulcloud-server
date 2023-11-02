import { School } from '../do';
import { SchoolDto, SlimSchoolDto } from '../dto';
import { YearsDto } from '../dto/years.dto';
import { FederalStateDtoMapper } from './federal-state.dto.mapper';
import { SchoolYearDtoMapper } from './school-year.dto.mapper';
import { SystemDtoMapper } from './system.dto.mapper';

export class SchoolDtoMapper {
	public static mapToDto(school: School, years: YearsDto): SchoolDto {
		const schoolProps = school.getProps();

		const federalState = FederalStateDtoMapper.mapToDto(schoolProps.federalState);
		const currentYear = schoolProps.currentYear && SchoolYearDtoMapper.mapToDto(schoolProps.currentYear);
		const features = schoolProps.features && Array.from(schoolProps.features);
		const systems = schoolProps.systems?.map((system) => SystemDtoMapper.mapToDto(system));

		const dto = new SchoolDto({
			...schoolProps,
			currentYear,
			federalState,
			features,
			systems,
			inMaintenance: school.isInMaintenance(),
			isExternal: school.isExternal(),
			years,
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
