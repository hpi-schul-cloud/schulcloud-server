import { BoardCommonToolService } from '@modules/board';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ContextExternalToolRepo } from '@shared/repo/contextexternaltool';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolType } from '../../context-external-tool/entity';
import { ExternalToolMetadata } from '../../external-tool/domain';
import { SchoolExternalTool, SchoolExternalToolMetadata } from '../../school-external-tool/domain';
import { ToolContextType } from '../enum';
import { ToolContextMapper } from '../mapper/tool-context.mapper';

@Injectable()
export class CommonToolMetadataService {
	constructor(
		private readonly schoolToolRepo: SchoolExternalToolRepo,
		private readonly contextToolRepo: ContextExternalToolRepo,
		@Inject(forwardRef(() => BoardCommonToolService))
		private readonly boardCommonToolService: BoardCommonToolService
	) {}

	async getMetadataForExternalTool(toolId: EntityId): Promise<ExternalToolMetadata> {
		const schoolExternalTools: SchoolExternalTool[] = await this.schoolToolRepo.findByExternalToolId(toolId);

		const schoolExternalToolIds: string[] = schoolExternalTools.map(
			(schoolExternalTool: SchoolExternalTool): string => schoolExternalTool.id
		);

		const externalToolMetadata: ExternalToolMetadata = await this.getMetadata(schoolExternalToolIds);

		return externalToolMetadata;
	}

	async getMetadataForSchoolExternalTool(schoolExternalToolId: EntityId): Promise<SchoolExternalToolMetadata> {
		const externalToolMetadata: ExternalToolMetadata = await this.getMetadata([schoolExternalToolId]);

		const schoolExternalToolMetadata: SchoolExternalToolMetadata = new SchoolExternalToolMetadata({
			contextExternalToolCountPerContext: externalToolMetadata.contextExternalToolCountPerContext,
		});

		return schoolExternalToolMetadata;
	}

	private async getMetadata(schoolExternalToolIds: EntityId[]): Promise<ExternalToolMetadata> {
		const externalToolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
			schoolExternalToolCount: schoolExternalToolIds.length,
			contextExternalToolCountPerContext: {
				[ContextExternalToolType.BOARD_ELEMENT]: 0,
				[ContextExternalToolType.COURSE]: 0,
				[ContextExternalToolType.MEDIA_BOARD]: 0,
			},
		});

		if (schoolExternalToolIds.length) {
			await Promise.all(
				Object.values(ToolContextType).map(async (contextType: ToolContextType): Promise<void> => {
					const type: ContextExternalToolType = ToolContextMapper.contextMapping[contextType];

					const contextExternalTools: ContextExternalTool[] =
						await this.contextToolRepo.findBySchoolToolIdsAndContextType(schoolExternalToolIds, type);

					const count: number = await this.countUsageForType(contextExternalTools, type);

					externalToolMetadata.contextExternalToolCountPerContext[type] = count;
				})
			);
		}

		return externalToolMetadata;
	}

	private async countUsageForType(
		contextExternalTools: ContextExternalTool[],
		contextType: ContextExternalToolType
	): Promise<number> {
		let count = 0;
		if (contextType === ContextExternalToolType.BOARD_ELEMENT) {
			count = await this.boardCommonToolService.countBoardUsageForExternalTools(contextExternalTools);
		} else {
			const contextIds: EntityId[] = contextExternalTools.map(
				(contextExternalTool: ContextExternalTool): EntityId => contextExternalTool.contextRef.id
			);

			count = new Set(contextIds).size;
		}

		return count;
	}
}
