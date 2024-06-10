import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { EntityId } from '@shared/domain/types';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolsDeletedEvent } from '../../context-external-tool/domain/event';
import { ToolDeleted } from '../../context-external-tool/domain/event/replace-element-with-placeholder.event';
import { ContextExternalToolEntity } from '../../context-external-tool/entity';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolEntity } from '../../external-tool/entity';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolEntity } from '../../school-external-tool/entity';

@Injectable()
export class CommonToolDeleteService2 {
	constructor(private readonly em: EntityManager, private readonly eventBus: EventBus) {}

	public async deleteExternalTool(externalTool: ExternalTool): Promise<void> {
		const externalToolEntity = await this.em.findOneOrFail(ExternalToolEntity, externalTool.id);

		this.em.remove(externalToolEntity);

		const schoolExternalToolEntities = await this.em.find(SchoolExternalToolEntity, { tool: externalTool.id });

		this.em.remove(schoolExternalToolEntities);

		const schoolExternalToolIds: EntityId[] = schoolExternalToolEntities.map(
			(schoolExternalToolEntity) => schoolExternalToolEntity.id
		);

		const contextExternalToolEntities = await this.em.find(ContextExternalToolEntity, {
			schoolTool: { $in: schoolExternalToolIds },
		});

		this.em.remove(contextExternalToolEntities);

		const deletedTools: ToolDeleted[] = contextExternalToolEntities.map((contextExternalToolEntity) => {
			return {
				contextExternalToolId: contextExternalToolEntity.id,
				title: contextExternalToolEntity.displayName ?? externalToolEntity.name,
			};
		});

		await this.em.flush();

		this.eventBus.publish(new ContextExternalToolsDeletedEvent({ deletedTools }));
	}

	public async deleteSchoolExternalTool(schoolExternalTool: SchoolExternalTool): Promise<void> {
		const externalToolEntity = await this.em.findOneOrFail(ExternalToolEntity, schoolExternalTool.toolId);

		const schoolExternalToolEntity = await this.em.findOneOrFail(SchoolExternalToolEntity, schoolExternalTool.id);

		this.em.remove(schoolExternalToolEntity);

		const contextExternalToolEntities = await this.em.find(ContextExternalToolEntity, {
			schoolTool: schoolExternalToolEntity.id,
		});

		this.em.remove(contextExternalToolEntities);

		const deletedTools: ToolDeleted[] = contextExternalToolEntities.map((contextExternalToolEntity) => {
			return {
				contextExternalToolId: contextExternalToolEntity.id,
				title: contextExternalToolEntity.displayName ?? externalToolEntity.name,
			};
		});

		await this.em.flush();

		this.eventBus.publish(new ContextExternalToolsDeletedEvent({ deletedTools }));
	}

	public async deleteContextExternalTool(contextExternalTool: ContextExternalTool): Promise<void> {
		const schoolExternalToolEntity = await this.em.findOneOrFail(
			SchoolExternalToolEntity,
			contextExternalTool.schoolToolRef.schoolToolId
		);
		const externalToolEntity = await this.em.findOneOrFail(ExternalToolEntity, schoolExternalToolEntity.tool);

		const contextExternalToolEntity = await this.em.findOneOrFail(ContextExternalToolEntity, contextExternalTool.id);

		this.em.remove(contextExternalToolEntity);

		const deletedTool: ToolDeleted = {
			contextExternalToolId: contextExternalToolEntity.id,
			title: contextExternalToolEntity.displayName ?? externalToolEntity.name,
		};

		await this.em.flush();

		this.eventBus.publish(new ContextExternalToolsDeletedEvent({ deletedTools: [deletedTool] }));
	}
}
