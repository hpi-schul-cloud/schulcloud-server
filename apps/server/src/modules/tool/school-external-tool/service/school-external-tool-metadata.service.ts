import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { ToolContextType } from '../../common/enum';
import { SchoolExternalToolMetadata } from '../domain';

@Injectable()
export class SchoolExternalToolMetadataService {
	constructor(
		private readonly schoolToolRepo: SchoolExternalToolRepo,
		private readonly contextToolRepo: ContextExternalToolRepo
	) {}

	async getMetadata(schoolExternalToolId: EntityId) {
		const contextTools = await Promise.all(
			Object.values(ToolContextType).map(async (contextType: ToolContextType) => {
				const countPerContext: number =
					await this.contextToolRepo.countContextExternalToolsBySchoolToolIdsAndContextType(contextType, [
						schoolExternalToolId.toString(),
					]);

				return { contextType, count: countPerContext };
			})
		);

		const schoolExternaltoolMetadata = this.createSchoolExternalToolMetadata(contextTools);

		return schoolExternaltoolMetadata;
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

	private createSchoolExternalToolMetadata(
		contextExternalToolCountPerContext: { contextType: ToolContextType; count: number }[]
	): SchoolExternalToolMetadata {
		const schoolExternaltoolMetadata: SchoolExternalToolMetadata = new SchoolExternalToolMetadata({
			contextExternalToolCountPerContext: this.createContextExternalToolMetaData(contextExternalToolCountPerContext),
		});

		return schoolExternaltoolMetadata;
	}
}
