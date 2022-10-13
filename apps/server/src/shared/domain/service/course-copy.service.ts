import { Injectable } from '@nestjs/common';
import { Course, User } from '@shared/domain/entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@shared/domain/types';
import { CopyHelperService } from './copy-helper.service';

export type CourseCopyParams = {
	originalCourse: Course;
	user: User;
	copyName?: string;
};

// WIP - completely move service and spec to learnroom module

@Injectable()
export class CourseCopyService {
	constructor(private readonly copyHelperService: CopyHelperService) {}

	copyCourse(params: CourseCopyParams): CopyStatus {
		const copy = new Course({
			school: params.user.school,
			name: params.copyName ?? params.originalCourse.name,
			color: params.originalCourse.color,
			teachers: [params.user],
			startDate: params.user.school.schoolYear?.startDate,
			untilDate: params.user.school.schoolYear?.endDate,
		});

		const elements = [
			{
				type: CopyElementType.METADATA,
				status: CopyStatusEnum.SUCCESS,
			},
			{
				type: CopyElementType.USER_GROUP, // teachers, substitutionTeachers, students,...
				status: CopyStatusEnum.NOT_DOING,
			},
			{
				type: CopyElementType.LTITOOL_GROUP,
				status: CopyStatusEnum.NOT_DOING,
			},
			{
				type: CopyElementType.TIME_GROUP,
				status: CopyStatusEnum.NOT_DOING,
			},
		];

		const courseGroupsExist = params.originalCourse.getCourseGroupItems().length > 0;
		if (courseGroupsExist) {
			elements.push({ type: CopyElementType.COURSEGROUP_GROUP, status: CopyStatusEnum.NOT_IMPLEMENTED });
		}

		const status = {
			title: copy.name,
			type: CopyElementType.COURSE,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: copy,
			originalEntity: params.originalCourse,
			elements,
		};

		return status;
	}
}
