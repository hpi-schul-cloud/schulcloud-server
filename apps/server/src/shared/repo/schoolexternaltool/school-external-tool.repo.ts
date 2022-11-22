import { BaseRepo } from '@shared/repo';
import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types/entity-id';
import { SchoolExternalTool } from '@shared/domain';

@Injectable()
export class SchoolExternalToolRepo extends BaseRepo<SchoolExternalTool> {
	get entityName(): EntityName<SchoolExternalTool> {
		return SchoolExternalTool;
	}

	async findByToolIdAndSchoolId(toolId: EntityId, schoolId: EntityId): Promise<SchoolExternalTool | null> {
		return this._em.findOne(SchoolExternalTool, { tool: new ObjectId(toolId), school: new ObjectId(schoolId) });
	}

	async findAllByToolId(toolId: EntityId): Promise<SchoolExternalTool[]> {
		return this._em.find(SchoolExternalTool, { tool: new ObjectId(toolId) });
	}

	async findAllBySchoolId(schoolId: EntityId): Promise<SchoolExternalTool[]> {
		return this._em.find(SchoolExternalTool, { school: new ObjectId(schoolId) });
	}
}
