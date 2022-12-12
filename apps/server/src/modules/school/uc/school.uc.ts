import { Injectable } from '@nestjs/common';
import { SchoolService } from '@src/modules/school/service/school.service';
import { EntityId } from '@shared/domain';
import { MigrationResponse } from '../controller/dto';

@Injectable()
export class SchoolUc {
	constructor(readonly schoolService: SchoolService) {}

	async setMigration(
		schoolId: EntityId,
		oauthMigrationPossible: boolean,
		oauthMigrationMandatory: boolean
	): Promise<MigrationResponse> {
		return this.schoolService.setMigration(schoolId, oauthMigrationPossible, oauthMigrationMandatory);
	}
}
