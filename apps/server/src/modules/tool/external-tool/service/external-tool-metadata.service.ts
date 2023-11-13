import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { ToolContextType } from '../../common/enum';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalToolMetadata } from '../domain';

@Injectable()
export class ExternalToolMetadataService {
	constructor(
		private readonly logger: Logger,
		private readonly externalToolRepo: ExternalToolRepo,
		private readonly schoolToolRepo: SchoolExternalToolRepo,
		private readonly contextToolRepo: ContextExternalToolRepo
	) {}

	async getMetaData(toolId: EntityId) {
		const schoolExternalTools = await this.schoolToolRepo.findByExternalToolId(toolId);
		if (schoolExternalTools.length < 0) {
			throw Error('Metadata of tool could not be loaded because no SchoolExternalTool was found');
		}
		const schoolExternalToolIds: string[] = schoolExternalTools.map(
			(schoolExternalTool: SchoolExternalTool): string =>
				// We can be sure that the repo returns the id
				schoolExternalTool.id as string
		);

		const contextTools = await Promise.all(
			Object.values(ToolContextType).map(async (contextType: ToolContextType) => {
				const countPerContext: number =
					await this.contextToolRepo.countContextExternalToolsBySchoolToolIdsAndContextType(
						contextType,
						schoolExternalToolIds
					);

				return { contextType, number: countPerContext };
			})
		);

		const externaltoolMetadata = this.createExternalToolMetadata(schoolExternalTools.length, contextTools);

		return externaltoolMetadata;
	}

	private createContextExternalToolMetaData(
		toolCountPerContext: { contextType: ToolContextType; number: number }[]
	): Map<ToolContextType, number> {
		const contextExternalToolMetadata: Map<ToolContextType, number> = new Map(
			toolCountPerContext.map((contextExternalToolCountPerSchool: { contextType: ToolContextType; number: number }) => [
				contextExternalToolCountPerSchool.contextType,
				contextExternalToolCountPerSchool.number,
			])
		);

		return contextExternalToolMetadata;
	}

	private createExternalToolMetadata(
		schoolExternalToolCount: number,
		contextExternalToolCountPerContext: { contextType; number }[]
	): ExternalToolMetadata {
		const externaltoolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
			schoolExternalToolCount,
			contextExternalToolCountPerContext: this.createContextExternalToolMetaData(contextExternalToolCountPerContext),
		});

		return externaltoolMetadata;
	}
}
