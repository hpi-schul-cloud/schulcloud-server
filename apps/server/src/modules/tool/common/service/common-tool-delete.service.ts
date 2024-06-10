import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolDeletedEvent } from '../../context-external-tool/domain/event';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';

@Injectable()
export class CommonToolDeleteService {
	constructor(
		private readonly externalToolRepo: ExternalToolRepo,
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly contextExternalToolRepo: ContextExternalToolRepo,
		private readonly eventBus: EventBus
	) {}

	public async deleteExternalTool(externalTool: ExternalTool): Promise<void> {
		await this.externalToolRepo.deleteById(externalTool.id);

		const schoolExternalTools = await this.schoolExternalToolRepo.findByExternalToolId(externalTool.id);

		const promises = schoolExternalTools.map(async (schoolExternalTool) => {
			await this.deleteSchoolExternalToolInternal(externalTool, schoolExternalTool);
		});

		await Promise.all(promises);
	}

	public async deleteSchoolExternalTool(schoolExternalTool: SchoolExternalTool): Promise<void> {
		const externalTool = await this.externalToolRepo.findById(schoolExternalTool.toolId);

		await this.deleteSchoolExternalToolInternal(externalTool, schoolExternalTool);
	}

	public async deleteContextExternalTool(contextExternalTool: ContextExternalTool): Promise<void> {
		const schoolExternalTool = await this.schoolExternalToolRepo.findById(
			contextExternalTool.schoolToolRef.schoolToolId
		);

		const externalTool = await this.externalToolRepo.findById(schoolExternalTool.toolId);

		await this.deleteContextExternalToolInternal(externalTool, contextExternalTool);
	}

	private async deleteSchoolExternalToolInternal(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool
	): Promise<void> {
		await this.schoolExternalToolRepo.deleteById(schoolExternalTool.id);

		const contextExternalTools = await this.contextExternalToolRepo.find({
			schoolToolRef: { schoolToolId: schoolExternalTool.id },
		});

		const promises = contextExternalTools.map(async (contextExternalTool) => {
			await this.deleteContextExternalToolInternal(externalTool, contextExternalTool);
		});

		await Promise.all(promises);
	}

	private async deleteContextExternalToolInternal(
		externalTool: ExternalTool,
		contextExternalTool: ContextExternalTool
	): Promise<void> {
		await this.contextExternalToolRepo.delete(contextExternalTool);

		this.eventBus.publish(
			new ContextExternalToolDeletedEvent({
				id: contextExternalTool.id,
				title: contextExternalTool.displayName ?? externalTool.name,
			})
		);
	}
}
