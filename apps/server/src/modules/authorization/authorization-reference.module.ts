import { BoardModule } from '@modules/board';
import { ToolModule } from '@modules/tool';
import { forwardRef, Module } from '@nestjs/common';
import {
	CourseGroupRepo,
	CourseRepo,
	LegacySchoolRepo,
	SchoolExternalToolRepo,
	SubmissionRepo,
	TaskRepo,
	TeamsRepo,
	UserRepo,
} from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { LessonModule } from '../lesson';
import { AuthorizationModule } from './authorization.module';
import { AuthorizationHelper, AuthorizationReferenceService, ReferenceLoader } from './domain';

/**
 * This module is part of an intermediate state. In the future it should be replaced by an AuthorizationApiModule.
 * For now it is used where the authorization itself needs to load data from the database.
 * Avoid using this module and load the needed data in your use cases and then use the normal AuthorizationModule!
 */
@Module({
	// TODO: remove forwardRef to TooModule N21-1055
	imports: [
		AuthorizationModule,
		LessonModule,
		forwardRef(() => ToolModule),
		forwardRef(() => BoardModule),
		LoggerModule,
	],
	providers: [
		AuthorizationHelper,
		ReferenceLoader,
		UserRepo,
		CourseRepo,
		CourseGroupRepo,
		TaskRepo,
		LegacySchoolRepo,
		TeamsRepo,
		SubmissionRepo,
		SchoolExternalToolRepo,
		AuthorizationReferenceService,
	],
	exports: [AuthorizationReferenceService],
})
export class AuthorizationReferenceModule {}
