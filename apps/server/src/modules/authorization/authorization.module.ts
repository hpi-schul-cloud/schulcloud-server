import { forwardRef, Module } from '@nestjs/common';
import { ALL_RULES } from '@shared/domain/rules';
import { FeathersModule } from '@shared/infra/feathers';
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
import { LoggerModule } from '@src/core/logger';
import { SchoolModule } from '@src/modules/school-migration';
import { ToolModule } from '@src/modules/tool';
import { BoardModule } from '../board';
import { AuthorizationHelper } from './authorization.helper';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';
import { ReferenceLoader } from './reference.loader';
import { RuleManager } from './rule-manager';

@Module({
	// TODO: remove forwardRef to TooModule N21-1055
	imports: [FeathersModule, LoggerModule, SchoolModule, forwardRef(() => ToolModule), forwardRef(() => BoardModule)],
	providers: [
		FeathersAuthorizationService,
		FeathersAuthProvider,
		AuthorizationService,
		...ALL_RULES,
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
		RuleManager,
		AuthorizationHelper,
	],
	exports: [FeathersAuthorizationService, AuthorizationService],
})
export class AuthorizationModule {}
