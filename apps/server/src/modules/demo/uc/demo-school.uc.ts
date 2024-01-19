import { AuthorizationService } from '@modules/authorization';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
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

		if (this.configService.get('FEATURE_DEMO_SCHOOLS_ENABLED') !== 'true') {
			throw new ForbiddenException('you are not allowed to create demo schools');
		}

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.CREATE_DEMO_SCHOOL]);

		const protocol = await this.demoSchoolService.createDemoSchool();

		return protocol;
	}
}
