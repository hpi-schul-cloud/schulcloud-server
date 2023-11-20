import { Page } from '@shared/domain';
import { GroupTypes } from '../../domain';
import { ClassInfoDto, ResolvedGroupDto } from '../../uc/dto';
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
};

export class GroupResponseMapper {
	// rename mapToClassInfoSearchListResponse
	// add explicit public
	static mapToClassInfosToListResponse(
		classInfos: Page<ClassInfoDto>,
		skip?: number,
		limit?: number
	): ClassInfoSearchListResponse {
		// rename const to maybe ClassInfoResponse?
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

	// rename to mapToClassInfoResponse
	private static mapToClassInfoToResponse(classInfo: ClassInfoDto): ClassInfoResponse {
		// rename const to maybe ClassInfoResponse?
		const mapped = new ClassInfoResponse({
			id: classInfo.id,
			type: classInfo.type,
			name: classInfo.name,
			externalSourceName: classInfo.externalSourceName,
			teachers: classInfo.teacherNames,
			schoolYear: classInfo.schoolYear,
			isUpgradable: classInfo.isUpgradable,
			studentCount: classInfo.studentCount,
		});

		return mapped;
	}

	static mapToGroupResponse(resolvedGroup: ResolvedGroupDto): GroupResponse {
		// rename const to maybe groupResponse?
		const mapped: GroupResponse = new GroupResponse({
			id: resolvedGroup.id,
			name: resolvedGroup.name,
			type: typeMapping[resolvedGroup.type],
			// put it to a const before
			externalSource: resolvedGroup.externalSource
				? new ExternalSourceResponse({
						externalId: resolvedGroup.externalSource.externalId,
						systemId: resolvedGroup.externalSource.systemId,
				  })
				: undefined,
			// put it to a const before
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
}
