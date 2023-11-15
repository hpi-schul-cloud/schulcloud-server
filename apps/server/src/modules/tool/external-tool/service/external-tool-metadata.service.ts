import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { ToolContextType } from '../../common/enum';
import { ContextExternalToolType } from '../../context-external-tool/entity';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalToolMetadata } from '../domain';
import { ToolContextMapper } from '../../common/mapper/tool-context.mapper';

@Injectable()
export class ExternalToolMetadataService {
	constructor(
		private readonly externalToolRepo: ExternalToolRepo,
		private readonly schoolToolRepo: SchoolExternalToolRepo,
		private readonly contextToolRepo: ContextExternalToolRepo
	) {}

	async getMetadata(toolId: EntityId): Promise<ExternalToolMetadata> {
		const schoolExternalTools: SchoolExternalTool[] = await this.schoolToolRepo.findByExternalToolId(toolId);
		if (schoolExternalTools.length < 1) {
			const externalToolMetadata = new ExternalToolMetadata({
				schoolExternalToolCount: 0,
				contextExternalToolCountPerContext: {
					[ToolContextMapper.contextMapping[ToolContextType.COURSE]]: 0,
					[ToolContextMapper.contextMapping[ToolContextType.BOARD_ELEMENT]]: 0,
				},
			});

			return externalToolMetadata;
		}

		const schoolExternalToolIds: string[] = schoolExternalTools.map(
			(schoolExternalTool: SchoolExternalTool): string =>
				// We can be sure that the repo returns the id
				schoolExternalTool.id as string
		);

		const contextTools: { contextType: ContextExternalToolType; countPerContext: number }[] = await Promise.all(
			Object.values(ToolContextType).map(
				async (
					contextType: ToolContextType
				): Promise<{ contextType: ContextExternalToolType; countPerContext: number }> => {
					const countPerContext: number = await this.contextToolRepo.countBySchoolToolIdsAndContextType(
						ToolContextMapper.contextMapping[contextType],
						schoolExternalToolIds
					);

					const type: ContextExternalToolType = ToolContextMapper.contextMapping[contextType];

					return { contextType: type, countPerContext };
				}
			)
		);

		const tools = Object.fromEntries(
			contextTools.map((contextTool): [ContextExternalToolType, number] => [
				contextTool.contextType,
				contextTool.countPerContext,
			])
		);

		const externaltoolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
			schoolExternalToolCount: schoolExternalTools.length,
			contextExternalToolCountPerContext: tools,
		});

		return externaltoolMetadata;
	}
}
