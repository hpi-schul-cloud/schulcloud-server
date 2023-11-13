import { forwardRef, Module } from '@nestjs/common';
import {
	CourseGroupRepo,
	CourseRepo,
	LessonRepo,
	SchoolExternalToolRepo,
	LegacySchoolRepo,
	TeamsRepo,
	UserRepo,
} from '@shared/repo';
import { ToolModule } from '@modules/tool';
import { LoggerModule } from '@src/core/logger';
import { BoardModule } from '@modules/board';
import { SubmissionRepo, TaskRepo } from '@modules/task/repo';
import { ReferenceLoader, AuthorizationReferenceService, AuthorizationHelper } from './domain';
import { AuthorizationModule } from './authorization.module';

/**
 * This module is part of an intermediate state. In the future it should be replaced by an AuthorizationApiModule.
 * For now it is used where the authorization itself needs to load data from the database.
 * Avoid using this module and load the needed data in your use cases and then use the normal AuthorizationModule!
 */
@Module({
	// TODO: remove forwardRef to TooModule N21-1055
	imports: [AuthorizationModule, forwardRef(() => ToolModule), forwardRef(() => BoardModule), LoggerModule],
	providers: [
		AuthorizationHelper,
		ReferenceLoader,
		UserRepo,
		CourseRepo,
		CourseGroupRepo,
		TaskRepo,
		LegacySchoolRepo,
		LessonRepo,
		TeamsRepo,
		SubmissionRepo,
		SchoolExternalToolRepo,
		AuthorizationReferenceService,
	],
	exports: [AuthorizationReferenceService],
})
export class AuthorizationReferenceModule {}
