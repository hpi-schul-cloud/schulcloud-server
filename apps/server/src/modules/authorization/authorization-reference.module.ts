import { forwardRef, Module } from '@nestjs/common';
import {
	CourseGroupRepo,
	CourseRepo,
	LessonRepo,
	SchoolExternalToolRepo,
	LegacySchoolRepo,
	SubmissionRepo,
	TaskRepo,
	TeamsRepo,
	UserRepo,
} from '@shared/repo';
import { ToolModule } from '@src/modules/tool';
import { LoggerModule } from '@src/core/logger';
import { BoardModule } from '@src/modules/board';
import { AuthorizationHelper } from './domain/service';
import { ReferenceLoader } from './domain/service/reference.loader';
import { AuthorizationReferenceService } from './domain';
import { AuthorizationModule } from './authorization.module';

/**
 * Should only be used inside of the authorization module
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
