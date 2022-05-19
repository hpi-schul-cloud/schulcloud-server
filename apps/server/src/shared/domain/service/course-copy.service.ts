import { Injectable } from '@nestjs/common';
import { Course, User } from '@shared/domain/entity';
import { CopyElementType, CopyStatusDTO, CopyStatusEnum } from '@shared/domain/types';

export type CourseCopyParams = {
	originalCourse: Course;
	user: User;
};

export type CourseCopyResponse = {
	copy: Course;
	status: CopyStatusDTO;
};

@Injectable()
export class CourseCopyService {
	copyCourseMetadata(params: CourseCopyParams): CourseCopyResponse {
		const copy = new Course({
			school: params.user.school,
			name: params.originalCourse.name,
			color: params.originalCourse.color,
			teachers: [params.user],
		});
		const status = {
			title: copy.name,
			type: CopyElementType.COURSE,
			status: CopyStatusEnum.SUCCESS,
			elements: [
				{
					title: 'substitutionTeachers',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.NOT_DOING,
				},
				{
					title: 'students',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.NOT_DOING,
				},
				{
					title: 'classes',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.NOT_DOING,
				},
				{
					title: 'ltiTools',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.NOT_DOING,
				},
				{
					title: 'tasks',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.SUCCESS,
				},
				{
					title: 'times',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.SUCCESS,
				},
			],
		};
		return { copy, status };
	}
}
