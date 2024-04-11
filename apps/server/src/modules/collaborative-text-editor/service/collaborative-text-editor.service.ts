import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { EtherpadClientAdapter } from '@src/infra/etherpad-client';
import { CreateCollaborativeTextEditorBodyParams } from '../controller/dto/create-collaborative-text-editor.body.params';

@Injectable()
export class CollaborativeTextEditorService {
	constructor(private readonly collaborativeTextEditorAdapter: EtherpadClientAdapter, private logger: Logger) {
		this.logger.setContext(CollaborativeTextEditorService.name);
	}

	async createCollaborativeTextEditor(userId: string, params: CreateCollaborativeTextEditorBodyParams) {
		const result = await this.collaborativeTextEditorAdapter.getOrCreateCollaborativeTextEditor(
			userId,
			params.parentId
		);

		return result;
	}
}
