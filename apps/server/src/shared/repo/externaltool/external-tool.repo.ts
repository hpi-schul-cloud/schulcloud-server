import { BaseRepo } from '@shared/repo';
import { ExternalTool, ToolConfigType } from '@shared/domain/entity/external-tool';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityName } from '@mikro-orm/core';

@Injectable()
export class ExternalToolRepo extends BaseRepo<ExternalTool> {
	get entityName(): EntityName<ExternalTool> {
		return ExternalTool;
	}

	async findByName(name: string): Promise<ExternalTool | null> {
		return this._em.findOne(ExternalTool, { name });
	}

	async findAllByConfigType(type: ToolConfigType): Promise<ExternalTool[]> {
		return this._em.find(ExternalTool, { config: { type } });
	}
}
