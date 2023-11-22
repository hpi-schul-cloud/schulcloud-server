import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo } from '@shared/repo';
import { ContextExternalTool, ContextRef } from '../domain';
import { ContextExternalToolQuery } from '../uc/dto/context-external-tool.types';
import { ToolContextTypesList } from '../../external-tool/controller/dto/response/tool-context-types-list';
import { ToolContextType } from '../../common/enum';

@Injectable()
export class ContextExternalToolService {
	constructor(private readonly contextExternalToolRepo: ContextExternalToolRepo) {}

	async findContextExternalTools(query: ContextExternalToolQuery): Promise<ContextExternalTool[]> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find(query);

		return contextExternalTools;
	}

	async findById(contextExternalToolId: EntityId): Promise<ContextExternalTool> {
		const tool: ContextExternalTool = await this.contextExternalToolRepo.findById(contextExternalToolId);

		return tool;
	}

	async saveContextExternalTool(contextExternalTool: ContextExternalTool): Promise<ContextExternalTool> {
		const savedContextExternalTool: ContextExternalTool = await this.contextExternalToolRepo.save(contextExternalTool);

		return savedContextExternalTool;
	}

	async deleteBySchoolExternalToolId(schoolExternalToolId: EntityId) {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find({
			schoolToolRef: {
				schoolToolId: schoolExternalToolId,
			},
		});

		await this.contextExternalToolRepo.delete(contextExternalTools);
	}

	async deleteContextExternalTool(contextExternalTool: ContextExternalTool): Promise<void> {
		await this.contextExternalToolRepo.delete(contextExternalTool);
	}

	async findAllByContext(contextRef: ContextRef): Promise<ContextExternalTool[]> {
		const contextExternalTools: ContextExternalTool[] = await this.contextExternalToolRepo.find({
			context: contextRef,
		});

		return contextExternalTools;
	}

	getToolContextTypes(): ToolContextTypesList {
		const toolContextTypes: ToolContextTypesList = { data: [ToolContextType.COURSE, ToolContextType.BOARD_ELEMENT] };

		return toolContextTypes;
	}
}
