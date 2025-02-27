import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { CourseGroupRepo } from '@modules/course/repo';
import { InstanceModule } from '@modules/instance';
import { LegacySchoolRepo } from '@modules/legacy-school/repo';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { SubmissionRepo } from '@shared/repo/submission';
import { TaskRepo } from '@shared/repo/task';
import { AuthorizationReferenceService, ReferenceLoader } from './domain';

/**
 * This module is part of an intermediate state. In the future it should be replaced by an AuthorizationApiModule.
 * For now it is used where the authorization itself needs to load data from the database.
 * Avoid using this module and load the needed data in your use cases and then use the normal AuthorizationModule!
 */
@Module({
	imports: [AuthorizationModule, LoggerModule, InstanceModule, UserModule],
	providers: [
		ReferenceLoader,
		CourseGroupRepo,
		TaskRepo,
		LegacySchoolRepo,
		SubmissionRepo,
		AuthorizationReferenceService,
	],
	exports: [AuthorizationReferenceService],
})
export class AuthorizationReferenceModule {}
