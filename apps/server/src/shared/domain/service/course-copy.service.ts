import { Injectable } from '@nestjs/common';
import { Board, Course, User } from '@shared/domain/entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@shared/domain/types';
import { BoardCopyService } from './board-copy.service';

export type CourseCopyParams = {
	originalCourse: Course;
	originalBoard: Board;
	user: User;
};

@Injectable()
export class CourseCopyService {
	constructor(private readonly boardCopyService: BoardCopyService) {}

	copyCourse(params: CourseCopyParams): CopyStatus {
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
		status.elements.push(
			this.boardCopyService.copyBoard({
				originalBoard: params.originalBoard,
				destinationCourse: copy,
				user: params.user,
			}).status
		);
		return status;
	}
}
