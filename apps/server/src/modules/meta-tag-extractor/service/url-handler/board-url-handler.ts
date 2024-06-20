import { BoardExternalReferenceType, ColumnBoardService } from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { Injectable } from '@nestjs/common';
import type { UrlHandler } from '../../interface/url-handler';
import { MetaData } from '../../types';
import { AbstractUrlHandler } from './abstract-url-handler';

@Injectable()
export class BoardUrlHandler extends AbstractUrlHandler implements UrlHandler {
	patterns: RegExp[] = [/\/rooms\/(.*?)\/board\/?$/i];

	constructor(private readonly columnBoardService: ColumnBoardService, private readonly courseService: CourseService) {
		super();
	}

	async getMetaData(url: string): Promise<MetaData | undefined> {
		const id = this.extractId(url);
		if (id === undefined) {
			return undefined;
		}

		const metaData = this.getDefaultMetaData(url, { type: 'board' });

		const columnBoard = await this.columnBoardService.findById(id);
		if (columnBoard) {
			metaData.title = columnBoard.title;
			if (columnBoard.context.type === BoardExternalReferenceType.Course) {
				const course = await this.courseService.findById(columnBoard.context.id);
				metaData.parentType = 'course';
				metaData.parentTitle = course.name;
			}
		}

		return metaData;
	}
}
