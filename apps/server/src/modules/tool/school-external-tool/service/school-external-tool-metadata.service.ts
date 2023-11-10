import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { Logger } from '../../../../core/logger';
import { ToolContextType } from '../../common/enum';
import { SchoolExternalToolMetadata } from '../domain/school-external-tool-metadata';

@Injectable()
export class SchoolExternalToolMetadataService {
	constructor(
		private readonly logger: Logger,
		private readonly externalToolRepo: ExternalToolRepo,
		private readonly schoolToolRepo: SchoolExternalToolRepo,
		private readonly contextToolRepo: ContextExternalToolRepo
	) {}

	async getMetadata(schoolExternalToolId: EntityId) {
		const toolCountPerContext: { ToolContextType; number }[] = await Promise.all(
			// Context Course
			Object.values(ToolContextType).map(
				async (
					contextType: ToolContextType
				): Promise<{
					ToolContextType;
					number;
				}> => {
					const countPerContext: number =
						await this.contextToolRepo.countContextExternalToolsBySchoolToolIdAndContextType(
							contextType,
							schoolExternalToolId
						);
					return { ToolContextType: contextType, number: countPerContext };
				}
			)
		);

		const schoolExternaltoolMetadata = this.createSchoolExternalToolMetadata(toolCountPerContext);

		/* const contextExternalToolMetadata: Map<ToolContextType, number> = new Map(
			toolCountPerContext.map((contextExternalToolCountPerSchool: { ToolContextType; number }) => [
				contextExternalToolCountPerSchool.ToolContextType,
				contextExternalToolCountPerSchool.number,
			])
		);

		const externaltoolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
			schoolExternalToolCount,
			contextExternalToolCountPerContext: contextExternalToolMetadata,
		});

		 */

		return schoolExternaltoolMetadata;
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

	private createSchoolExternalToolMetadata(
		contextExternalToolCountPerContext: { ToolContextType; number }[]
	): SchoolExternalToolMetadata {
		const schoolExternaltoolMetadata: SchoolExternalToolMetadata = new SchoolExternalToolMetadata({
			contextExternalToolCountPerContext: this.createContextExternalToolMetaData(contextExternalToolCountPerContext),
		});

		return schoolExternaltoolMetadata;
	}
}
