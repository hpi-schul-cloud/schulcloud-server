import { Page } from '@shared/domain/domainobject';
import { GroupTypes } from '../../domain';
import { ClassInfoDto, ResolvedGroupDto, ResolvedGroupUser } from '../../uc/dto';
import {
	ClassInfoResponse,
	ClassInfoSearchListResponse,
	ExternalSourceResponse,
	GroupResponse,
	GroupTypeResponse,
	GroupUserResponse,
} from '../dto';

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
			teachers: classInfo.teacherNames,
			schoolYear: classInfo.schoolYear,
			isUpgradable: classInfo.isUpgradable,
			studentCount: classInfo.studentCount,
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
			organizationId: resolvedGroup.organizationId,
		});

		return groupResponse;
	}
}
