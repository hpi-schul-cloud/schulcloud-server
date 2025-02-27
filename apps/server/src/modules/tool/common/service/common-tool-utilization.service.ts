import { BoardCommonToolService } from '@modules/board';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolRepo, ContextExternalToolType } from '../../context-external-tool/repo';
import { ExternalToolUtilization } from '../../external-tool/domain';
import { SchoolExternalTool, SchoolExternalToolUtilization } from '../../school-external-tool/domain';
import { SchoolExternalToolRepo } from '../../school-external-tool/repo';
import { ToolContextType } from '../enum';
import { ToolContextMapper } from '../mapper/tool-context.mapper';

@Injectable()
export class CommonToolUtilizationService {
	constructor(
		private readonly schoolToolRepo: SchoolExternalToolRepo,
		private readonly contextToolRepo: ContextExternalToolRepo,
		@Inject(forwardRef(() => BoardCommonToolService))
		private readonly boardCommonToolService: BoardCommonToolService
	) {}

	public async getUtilizationForExternalTool(toolId: EntityId): Promise<ExternalToolUtilization> {
		const schoolExternalTools: SchoolExternalTool[] = await this.schoolToolRepo.findByExternalToolId(toolId);

		const schoolExternalToolIds: string[] = schoolExternalTools.map(
			(schoolExternalTool: SchoolExternalTool): string => schoolExternalTool.id
		);

		const externalToolUtilization: ExternalToolUtilization = await this.getUtilization(schoolExternalToolIds);

		return externalToolUtilization;
	}

	public async getUtilizationForSchoolExternalTool(
		schoolExternalToolId: EntityId
	): Promise<SchoolExternalToolUtilization> {
		const externalToolUtilization: ExternalToolUtilization = await this.getUtilization([schoolExternalToolId]);

		const schoolExternalToolMetadata: SchoolExternalToolUtilization = new SchoolExternalToolUtilization({
			contextExternalToolCountPerContext: externalToolUtilization.contextExternalToolCountPerContext,
		});

		return schoolExternalToolMetadata;
	}

	private async getUtilization(schoolExternalToolIds: EntityId[]): Promise<ExternalToolUtilization> {
		const externalToolUtilization: ExternalToolUtilization = new ExternalToolUtilization({
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

					externalToolUtilization.contextExternalToolCountPerContext[type] = count;
				})
			);
		}

		return externalToolUtilization;
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
