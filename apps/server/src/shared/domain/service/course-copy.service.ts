import { Injectable } from '@nestjs/common';
import { Board, Course, User } from '@shared/domain/entity';
import { CopyElementType, CopyStatusDTO, CopyStatusEnum } from '@shared/domain/types';
import { BoardCopyService } from './board-copy.service';

export type CourseCopyParams = {
	originalCourse: Course;
	originalBoard: Board;
	user: User;
};

export type CourseCopyResponse = {
	copy: Course;
	status: CopyStatusDTO;
};

@Injectable()
export class CourseCopyService {
	constructor(private readonly boardCopyService: BoardCopyService) {}

	copyCourseWithBoard(params: CourseCopyParams): CourseCopyResponse {
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
		status.elements.push(
			this.boardCopyService.copyBoard({ originalBoard: params.originalBoard, destinationCourse: copy })
		);
		return { copy, status };
	}
}
