import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { ToolContextType } from '../../common/enum';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalToolMetadata } from '../domain/external-tool-metadata';

@Injectable()
export class ExternalToolMetadataService {
	constructor(
		private readonly logger: Logger,
		private readonly externalToolRepo: ExternalToolRepo,
		private readonly schoolToolRepo: SchoolExternalToolRepo,
		private readonly contextToolRepo: ContextExternalToolRepo
	) {}

	async getMetadataComplicated(toolId: EntityId) {
		const schoolExternalToolCount: number = await this.schoolToolRepo.countSchoolExternalToolsByExternalToolId(toolId);

		const schoolExternalTools = await this.schoolToolRepo.findByExternalToolId(toolId);
		let contextExternalToolCountPerContext: number;

		const toolCountPerContext: { ToolContextType; number }[] = await Promise.all(
			Object.values(ToolContextType).map(async (contextType: ToolContextType): Promise<{ ToolContextType; number }> => {
				const contextExternalToolCountPerSchool = await Promise.all(
					schoolExternalTools.map(async (schoolExternalTool: SchoolExternalTool) => {
						if (schoolExternalTool.id !== undefined) {
							const countPerContext: number =
								await this.contextToolRepo.countContextExternalToolsBySchoolToolIdAndContextType(
									contextType,
									schoolExternalTool.id
								);
							return countPerContext;
						}
						throw new Error('SchoolExternalTool id is undefined');
					})
				);

				contextExternalToolCountPerSchool.forEach((countPerContext: number) => {
					contextExternalToolCountPerContext += countPerContext;
				});

				return { ToolContextType: contextType, number: contextExternalToolCountPerContext };
			})
		);

		const externaltoolMetadata = this.createExternalToolMetadata(schoolExternalToolCount, toolCountPerContext);

		return externaltoolMetadata;
	}

	private createContextExternalToolMetaData(
		toolCountPerContext: { ToolContextType; number }[]
	): Map<ToolContextType, number> {
		const contextExternalToolMetadata: Map<ToolContextType, number> = new Map(
			toolCountPerContext.map((contextExternalToolCountPerSchool: { ToolContextType; number }) => [
				contextExternalToolCountPerSchool.ToolContextType,
				contextExternalToolCountPerSchool.number,
			])
		);

		return contextExternalToolMetadata;
	}

	private createExternalToolMetadata(
		schoolExternalToolCount: number,
		contextExternalToolCountPerContext: { ToolContextType; number }[]
	): ExternalToolMetadata {
		const externaltoolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
			schoolExternalToolCount,
			contextExternalToolCountPerContext: this.createContextExternalToolMetaData(contextExternalToolCountPerContext),
		});

		return externaltoolMetadata;
	}
}
