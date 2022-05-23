import { Injectable } from '@nestjs/common';
import { Board, Course } from '../entity';
import { CopyElementType, CopyStatusDTO, CopyStatusEnum } from '../types';

export type BoardCopyParams = {
	originalBoard: Board;
	destinationCourse: Course;
};

@Injectable()
export class BoardCopyService {
	copyBoard(params: BoardCopyParams): CopyStatusDTO {
		return {
			title: 'board',
			type: CopyElementType.BOARD,
			status: CopyStatusEnum.NOT_IMPLEMENTED,
		};
	}
}
