import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { DemoSchool } from '../domain';
import { DemoSchoolCreateLoggable } from '../loggable';
import { DemoSchoolService } from '../service/demo-school.service';

@Injectable()
export class DemoSchoolUc {
	constructor(
		private readonly logger: Logger,
		private readonly demoSchoolService: DemoSchoolService,
		private readonly authorizationService: AuthorizationService
	) {
		this.logger.setContext(DemoSchoolUc.name);
	}

	async createSchool(userId: EntityId): Promise<DemoSchool> {
		this.logger.debug(new DemoSchoolCreateLoggable(userId));

		// TODO check permission

		const school = await this.demoSchoolService.createSchool();

		return school;
	}
}
