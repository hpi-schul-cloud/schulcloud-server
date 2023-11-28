import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { ToolContextType } from '../../common/enum';
import { ToolContextMapper } from '../../common/mapper/tool-context.mapper';
import { ContextExternalToolType } from '../../context-external-tool/entity';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalToolMetadata } from '../domain';

@Injectable()
export class ExternalToolMetadataService {
	constructor(
		private readonly schoolToolRepo: SchoolExternalToolRepo,
		private readonly contextToolRepo: ContextExternalToolRepo
	) {}

	async getMetadata(toolId: EntityId): Promise<ExternalToolMetadata> {
		const schoolExternalTools: SchoolExternalTool[] = await this.schoolToolRepo.findByExternalToolId(toolId);

		const schoolExternalToolIds: string[] = schoolExternalTools.map(
			(schoolExternalTool: SchoolExternalTool): string =>
				// We can be sure that the repo returns the id
				schoolExternalTool.id as string
		);
		const contextExternalToolCount: Record<ContextExternalToolType, number> = {
			[ContextExternalToolType.BOARD_ELEMENT]: 0,
			[ContextExternalToolType.COURSE]: 0,
		};
		if (schoolExternalTools.length >= 1) {
			await Promise.all(
				Object.values(ToolContextType).map(async (contextType: ToolContextType): Promise<void> => {
					const type: ContextExternalToolType = ToolContextMapper.contextMapping[contextType];

					const countPerContext: number = await this.contextToolRepo.countBySchoolToolIdsAndContextType(
						type,
						schoolExternalToolIds
					);
					contextExternalToolCount[type] = countPerContext;
				})
			);
		}

		const externalToolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
			schoolExternalToolCount: schoolExternalTools.length,
			contextExternalToolCountPerContext: contextExternalToolCount,
		});

		return externalToolMetadata;
	}
}
