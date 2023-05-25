import { Module } from '@nestjs/common';
import { ALL_RULES } from '@shared/domain/rules';
import { FeathersModule } from '@shared/infra/feathers';
import {
	CourseGroupRepo,
	CourseRepo,
	LessonRepo,
	SchoolExternalToolRepo,
	SchoolRepo,
	SubmissionRepo,
	TaskRepo,
	TeamsRepo,
	UserRepo,
} from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { BoardModule } from '@src/modules/board';
import { SchoolModule } from '@src/modules/school';
import { ToolModule } from '@src/modules/tool';
import { AuthorizationHelper } from './authorization.helper';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';
import { ReferenceLoader } from './reference.loader';
import { RuleManager } from './rule-manager';

@Module({
	imports: [FeathersModule, BoardModule, LoggerModule, SchoolModule, ToolModule],
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
		SchoolRepo,
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
