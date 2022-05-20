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
			status: CopyStatusEnum.PARTIAL,
			copyEntity: copy,
			elements: [
				{
					title: 'metadata',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.SUCCESS,
				},
				{
					title: 'teachers',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.NOT_DOING,
				},
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
					type: CopyElementType.TASK,
					status: CopyStatusEnum.NOT_IMPLEMENTED,
				},
				{
					title: 'times',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.NOT_IMPLEMENTED,
				},
				{
					title: 'lessons',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.NOT_IMPLEMENTED,
				},
				{
					title: 'files',
					type: CopyElementType.FILE,
					status: CopyStatusEnum.NOT_IMPLEMENTED,
				},
				{
					title: 'coursegroups',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.NOT_IMPLEMENTED,
				},
			],
		};
		return { copy, status };
	}
}
