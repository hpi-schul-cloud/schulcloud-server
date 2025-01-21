import { AuthorizationModule } from '@modules/authorization';
import { InstanceModule } from '@modules/instance';
import { Module } from '@nestjs/common';
import { CourseRepo } from '@shared/repo/course';
import { CourseGroupRepo } from '@shared/repo/coursegroup';
import { LegacySchoolRepo } from '@shared/repo/school';
import { SubmissionRepo } from '@shared/repo/submission';
import { TaskRepo } from '@shared/repo/task';
import { UserRepo } from '@shared/repo/user';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationReferenceService, ReferenceLoader } from './domain';

/**
 * This module is part of an intermediate state. In the future it should be replaced by an AuthorizationApiModule.
 * For now it is used where the authorization itself needs to load data from the database.
 * Avoid using this module and load the needed data in your use cases and then use the normal AuthorizationModule!
 */
@Module({
	imports: [AuthorizationModule, LoggerModule, InstanceModule],
	providers: [
		ReferenceLoader,
		UserRepo,
		CourseRepo,
		CourseGroupRepo,
		TaskRepo,
		LegacySchoolRepo,
		SubmissionRepo,
		AuthorizationReferenceService,
	],
	exports: [AuthorizationReferenceService],
})
export class AuthorizationReferenceModule {}
