import { Injectable } from '@nestjs/common';
import { Course, User } from '@shared/domain/entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@shared/domain/types';
import { NameCopyService } from './name-copy.service';

export type CourseCopyParams = {
	originalCourse: Course;
	user: User;
};

@Injectable()
export class CourseCopyService {
	constructor(private readonly nameCopyService: NameCopyService) {}

	copyCourse(params: CourseCopyParams): CopyStatus {
		const copy = new Course({
			school: params.user.school,
			name: this.nameCopyService.deriveCopyName(params.originalCourse.name),
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
					title: 'times',
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

		return status;
	}
}
