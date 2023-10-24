import { Injectable } from '@nestjs/common';
import { EntityId, IPagination, Permission } from '@shared/domain';
// Importing AuthorizationService and AuthorizationContextBuilder from the barrel file leads to a runtime error.
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { SchoolDto, SlimSchoolDto } from '../dto';
import { SchoolDtoMapper } from '../mapper';
import { SchoolService } from '../service';
import { SchoolQuery } from '../type';

@Injectable()
export class SchoolUc {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async getListOfSlimSchools(query: SchoolQuery, pagination: IPagination): Promise<SlimSchoolDto[]> {
		const schools = await this.schoolService.getAllSchools(query, pagination);

		const dtos = SchoolDtoMapper.mapToListOfSlimDtos(schools);

		return dtos;
	}

	public async getSchool(schoolId: EntityId, userId: EntityId): Promise<SchoolDto> {
		const school = await this.schoolService.getSchool(schoolId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const authContext = AuthorizationContextBuilder.read([Permission.SCHOOL_EDIT]);
		this.authorizationService.checkPermission(user, school, authContext);

		const dto = SchoolDtoMapper.mapToDto(school);

		return dto;
	}
}
