import { BaseRepo } from '@shared/repo';
import { SchoolExternalTool } from '@shared/domain';
import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';

@Injectable()
export class SchoolExternalToolRepo extends BaseRepo<SchoolExternalTool> {
	get entityName(): EntityName<SchoolExternalTool> {
		return SchoolExternalTool;
	}
}
