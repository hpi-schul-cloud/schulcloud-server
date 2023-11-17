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
		const contextExternalToolCount: Record<ContextExternalToolType, number> = {
			[ContextExternalToolType.BOARD_ELEMENT]: 0,
			[ContextExternalToolType.COURSE]: 0,
		};

		await Promise.all(
			Object.values(ToolContextType).map(async (contextType: ToolContextType): Promise<void> => {
				const type: ContextExternalToolType = ToolContextMapper.contextMapping[contextType];

				const countPerContext: number = await this.contextToolRepo.countBySchoolToolIdsAndContextType(type, [
					schoolExternalToolId,
				]);

				contextExternalToolCount[type] = countPerContext;
			})
		);

		const schoolExternaltoolMetadata: SchoolExternalToolMetadata = new SchoolExternalToolMetadata({
			contextExternalToolCountPerContext: contextExternalToolCount,
		});

		return schoolExternaltoolMetadata;
	}
}
