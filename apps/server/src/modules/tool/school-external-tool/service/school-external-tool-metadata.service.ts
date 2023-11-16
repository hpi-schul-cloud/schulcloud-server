import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo } from '@shared/repo';
import { ToolContextType } from '../../common/enum';
import { ToolContextMapper } from '../../common/mapper/tool-context.mapper';
import { ContextExternalToolType } from '../../context-external-tool/entity';
import { SchoolExternalToolMetadata } from '../domain';

@Injectable()
export class SchoolExternalToolMetadataService {
	constructor(private readonly contextToolRepo: ContextExternalToolRepo) {}

	async getMetadata(schoolExternalToolId: EntityId) {
		const contextTools: { contextType: ContextExternalToolType; countPerContext: number }[] = await Promise.all(
			Object.values(ToolContextType).map(
				async (
					contextType: ToolContextType
				): Promise<{ contextType: ContextExternalToolType; countPerContext: number }> => {
					const countPerContext: number = await this.contextToolRepo.countBySchoolToolIdsAndContextType(
						ToolContextMapper.contextMapping[contextType],
						[schoolExternalToolId]
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

		const schoolExternaltoolMetadata: SchoolExternalToolMetadata = new SchoolExternalToolMetadata({
			contextExternalToolCountPerContext: tools,
		});

		return schoolExternaltoolMetadata;
	}
}
