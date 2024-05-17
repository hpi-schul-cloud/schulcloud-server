import {
	BoardCommonToolService,
	BoardExternalReferenceType,
	BoardNodeService,
	ColumnBoard,
	MediaBoard,
} from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { Injectable } from '@nestjs/common';
import { Course } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

import { CustomParameterType, ToolContextType } from '../../../common/enum';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { ParameterTypeNotImplementedLoggableException } from '../../error';
import { AutoParameterStrategy } from './auto-parameter.strategy';

@Injectable()
export class AutoContextNameStrategy implements AutoParameterStrategy {
	constructor(
		private readonly courseService: CourseService,
		private readonly boardCommonToolService: BoardCommonToolService,
		private readonly boardNodeService: BoardNodeService
	) {}

	async getValue(
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
	): Promise<string | undefined> {
		switch (contextExternalTool.contextRef.type) {
			case ToolContextType.COURSE: {
				const courseValue: string = await this.getCourseValue(contextExternalTool.contextRef.id);

				return courseValue;
			}
			case ToolContextType.BOARD_ELEMENT: {
				const boardValue: string | undefined = await this.getBoardValue(contextExternalTool.contextRef.id);

				return boardValue;
			}
			default: {
				throw new ParameterTypeNotImplementedLoggableException(
					`${CustomParameterType.AUTO_CONTEXTNAME}/${contextExternalTool.contextRef.type as string}`
				);
			}
		}
	}

	private async getCourseValue(courseId: EntityId): Promise<string> {
		const course: Course = await this.courseService.findById(courseId);

		return course.name;
	}

	private async getBoardValue(elementId: EntityId): Promise<string | undefined> {
		const element = await this.boardNodeService.findContentElementById(elementId);

		const board: ColumnBoard | MediaBoard = await this.boardCommonToolService.findByDescendant(element);

		if (board.context.type === BoardExternalReferenceType.Course) {
			const courseName: string = await this.getCourseValue(board.context.id);

			return courseName;
		}

		return undefined;
	}
}
