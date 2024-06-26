import { Page } from '@shared/domain/domainobject';
import { GroupTypes } from '../../domain';
import { ClassInfoDto, CourseInfoDto, ResolvedGroupDto } from '../../uc/dto';
import {
	ClassInfoResponse,
	ClassInfoSearchListResponse,
	ExternalSourceResponse,
	GroupListResponse,
	GroupPaginationParams,
	GroupResponse,
	GroupTypeResponse,
	GroupUserResponse,
} from '../dto';
import { CourseInfoResponse } from '../dto/response/course-info.response';

const typeMapping: Record<GroupTypes, GroupTypeResponse> = {
	[GroupTypes.CLASS]: GroupTypeResponse.CLASS,
	[GroupTypes.COURSE]: GroupTypeResponse.COURSE,
	[GroupTypes.OTHER]: GroupTypeResponse.OTHER,
};

export class GroupResponseMapper {
	static mapToClassInfosToListResponse(
		classInfos: Page<ClassInfoDto>,
		skip?: number,
		limit?: number
	): ClassInfoSearchListResponse {
		const mappedData: ClassInfoResponse[] = classInfos.data.map((classInfo) =>
			this.mapToClassInfoToResponse(classInfo)
		);

		const response: ClassInfoSearchListResponse = new ClassInfoSearchListResponse(
			mappedData,
			classInfos.total,
			skip,
			limit
		);

		return response;
	}

	private static mapToClassInfoToResponse(classInfo: ClassInfoDto): ClassInfoResponse {
		const mapped: ClassInfoResponse = new ClassInfoResponse({
			id: classInfo.id,
			type: classInfo.type,
			name: classInfo.name,
			externalSourceName: classInfo.externalSourceName,
			teacherNames: classInfo.teacherNames,
			schoolYear: classInfo.schoolYear,
			isUpgradable: classInfo.isUpgradable,
			studentCount: classInfo.studentCount,
			synchronizedCourses: classInfo.synchronizedCourses?.map(
				(synchronizedCourse: CourseInfoDto): CourseInfoResponse => new CourseInfoResponse(synchronizedCourse)
			),
		});

		return mapped;
	}

	static mapToGroupResponse(resolvedGroup: ResolvedGroupDto): GroupResponse {
		const mapped: GroupResponse = new GroupResponse({
			id: resolvedGroup.id,
			name: resolvedGroup.name,
			type: typeMapping[resolvedGroup.type],
			externalSource: resolvedGroup.externalSource
				? new ExternalSourceResponse({
						externalId: resolvedGroup.externalSource.externalId,
						systemId: resolvedGroup.externalSource.systemId,
				  })
				: undefined,
			users: resolvedGroup.users.map(
				(user) =>
					new GroupUserResponse({
						id: user.user.id as string,
						role: user.role.name,
						firstName: user.user.firstName,
						lastName: user.user.lastName,
					})
			),
			organizationId: resolvedGroup.organizationId,
		});

		return mapped;
	}

	static mapToGroupListResponse(groups: Page<ResolvedGroupDto>, pagination: GroupPaginationParams): GroupListResponse {
		const groupResponseData: GroupResponse[] = groups.data.map(
			(group: ResolvedGroupDto): GroupResponse => this.mapToGroupResponse(group)
		);

		const response: GroupListResponse = new GroupListResponse(
			groupResponseData,
			groups.total,
			pagination.skip,
			pagination.limit
		);

		return response;
	}
}
