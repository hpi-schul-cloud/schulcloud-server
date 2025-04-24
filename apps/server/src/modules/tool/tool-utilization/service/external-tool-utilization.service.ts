import { BoardCommonToolService } from '@modules/board';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ToolContextType } from '../../common/enum';
import { ToolContextMapper } from '../../common/mapper/tool-context.mapper';
import { ContextExternalToolService } from '../../context-external-tool';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolType } from '../../context-external-tool/repo';
import { SchoolExternalToolService } from '../../school-external-tool';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalToolUtilization, SchoolExternalToolUtilization } from '../domain';

@Injectable()
export class ExternalToolUtilizationService {
	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly boardCommonToolService: BoardCommonToolService
	) {}

	public async getUtilizationForExternalTool(toolId: EntityId): Promise<ExternalToolUtilization> {
		const schoolExternalTools: SchoolExternalTool[] = await this.schoolExternalToolService.findSchoolExternalTools({
			toolId,
		});

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
						await this.contextExternalToolService.findBySchoolToolIdsAndContextType(schoolExternalToolIds, type);

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
