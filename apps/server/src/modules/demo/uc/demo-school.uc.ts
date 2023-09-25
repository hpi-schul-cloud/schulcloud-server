import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId, Permission, User } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { DemoSchoolCreateLoggable } from '../loggable';
import { DemoSchoolService } from '../service/demo-school.service';
import { CreationProtocol } from '../types';

@Injectable()
export class DemoSchoolUc {
	constructor(
		private readonly logger: Logger,
		private readonly configService: ConfigService,
		private readonly demoSchoolService: DemoSchoolService,
		private readonly authorizationService: AuthorizationService
	) {
		this.logger.setContext(DemoSchoolUc.name);
	}

	async createSchool(userId: EntityId): Promise<CreationProtocol> {
		this.logger.debug(new DemoSchoolCreateLoggable(userId));

		if (this.configService.get('FEATURE_CYPRESS_SETUP_ENABLED') !== 'true') {
			throw new ForbiddenException('you are not allowed to create demo schools');
		}

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.CREATE_DEMO_SCHOOL]);

		const protocol = await this.demoSchoolService.createDemoSchool();

		return protocol;
	}
}
