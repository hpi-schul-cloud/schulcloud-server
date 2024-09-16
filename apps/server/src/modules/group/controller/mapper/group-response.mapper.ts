import { Page } from '@shared/domain/domainobject';
import { GroupTypes } from '../../domain';
import { ClassInfoDto, CourseInfoDto, ResolvedGroupDto, ResolvedGroupUser } from '../../uc/dto';
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
import { PeriodResponse } from '../dto/response/period.response';

const typeMapping: Record<GroupTypes, GroupTypeResponse> = {
	[GroupTypes.CLASS]: GroupTypeResponse.CLASS,
	[GroupTypes.COURSE]: GroupTypeResponse.COURSE,
	[GroupTypes.OTHER]: GroupTypeResponse.OTHER,
};

export class GroupResponseMapper {
	public static mapToClassInfoSearchListResponse(
		classInfos: Page<ClassInfoDto>,
		skip?: number,
		limit?: number
	): ClassInfoSearchListResponse {
		const classInfoResponses: ClassInfoResponse[] = classInfos.data.map((classInfo) =>
			this.mapToClassInfoResponse(classInfo)
		);

		const response: ClassInfoSearchListResponse = new ClassInfoSearchListResponse(
			classInfoResponses,
			classInfos.total,
			skip,
			limit
		);

		return response;
	}

	private static mapToClassInfoResponse(classInfo: ClassInfoDto): ClassInfoResponse {
		const classInfoResponse: ClassInfoResponse = new ClassInfoResponse({
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

		return classInfoResponse;
	}

	static mapToGroupResponse(resolvedGroup: ResolvedGroupDto): GroupResponse {
		const externalSource: ExternalSourceResponse | undefined = resolvedGroup.externalSource
			? new ExternalSourceResponse({
					externalId: resolvedGroup.externalSource.externalId,
					systemId: resolvedGroup.externalSource.systemId,
			  })
			: undefined;

		const users: GroupUserResponse[] = resolvedGroup.users.map(
			(user: ResolvedGroupUser): GroupUserResponse =>
				new GroupUserResponse({
					id: user.user.id as string,
					role: user.role.name,
					firstName: user.user.firstName,
					lastName: user.user.lastName,
				})
		);

		const groupResponse: GroupResponse = new GroupResponse({
			id: resolvedGroup.id,
			name: resolvedGroup.name,
			type: typeMapping[resolvedGroup.type],
			externalSource,
			users,
			validPeriod: resolvedGroup.validPeriod
				? new PeriodResponse({ from: resolvedGroup.validPeriod.from, until: resolvedGroup.validPeriod.until })
				: undefined,
			organizationId: resolvedGroup.organizationId,
		});

		return groupResponse;
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
