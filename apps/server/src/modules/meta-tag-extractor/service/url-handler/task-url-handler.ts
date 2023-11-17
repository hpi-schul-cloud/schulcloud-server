import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import type { UrlHandler } from '../../interface/url-handler';
import { MetaData } from '../../types';
import { AbstractUrlHandler } from './abstract-url-handler';

@Injectable()
export class TaskUrlHandler extends AbstractUrlHandler implements UrlHandler {
	patterns: RegExp[] = [/\/homework\/([0-9a-z]+)$/i];

	constructor(private readonly taskService: TaskService) {
		super();
	}

	async getMetaData(url: string): Promise<MetaData | undefined> {
		const id = this.extractId(url);
		if (id === undefined) {
			return undefined;
		}

		const metaData = this.getDefaultMetaData(url, { type: 'task' });
		const task = await this.taskService.findById(id);
		if (task) {
			metaData.title = task.name;
		}

		return metaData;
	}
}
