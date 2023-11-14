import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { ToolContextType } from '../../common/enum';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalToolMetadata } from '../domain';
import { ExternalToolMetadataLoggable } from '../loggable';

@Injectable()
export class ExternalToolMetadataService {
	constructor(
		private readonly logger: Logger,
		private readonly externalToolRepo: ExternalToolRepo,
		private readonly schoolToolRepo: SchoolExternalToolRepo,
		private readonly contextToolRepo: ContextExternalToolRepo
	) {}

	async getMetaData(toolId: EntityId): Promise<ExternalToolMetadata> {
		const schoolExternalTools = await this.schoolToolRepo.findByExternalToolId(toolId);
		if (schoolExternalTools.length < 1) {
			this.logger.info(
				new ExternalToolMetadataLoggable(
					`There are no such schoolExternalTools for toolId: ${toolId}, returning empty metadata.`
				)
			);

			const externalToolMetadata = this.createExternalToolMetadata(0, [
				{ contextType: ToolContextType.COURSE, count: 0 },
				{ contextType: ToolContextType.BOARD_ELEMENT, count: 0 },
			]);

			return externalToolMetadata;
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

				return { contextType, count: countPerContext };
			})
		);

		const externaltoolMetadata = this.createExternalToolMetadata(schoolExternalTools.length, contextTools);

		return externaltoolMetadata;
	}

	private createContextExternalToolMetaData(
		toolCountPerContext: { contextType: ToolContextType; count: number }[]
	): Map<ToolContextType, number> {
		const contextExternalToolMetadata: Map<ToolContextType, number> = new Map(
			toolCountPerContext.map((contextExternalToolCountPerSchool: { contextType: ToolContextType; count: number }) => [
				contextExternalToolCountPerSchool.contextType,
				contextExternalToolCountPerSchool.count,
			])
		);

		return contextExternalToolMetadata;
	}

	private createExternalToolMetadata(
		schoolExternalToolCount: number,
		contextExternalToolCountPerContext: { contextType: ToolContextType; count: number }[]
	): ExternalToolMetadata {
		const externaltoolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
			schoolExternalToolCount,
			contextExternalToolCountPerContext: this.createContextExternalToolMetaData(contextExternalToolCountPerContext),
		});

		return externaltoolMetadata;
	}
}
