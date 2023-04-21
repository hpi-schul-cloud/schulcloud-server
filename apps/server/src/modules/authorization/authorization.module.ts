import { Module } from '@nestjs/common';
import { ALL_RULES } from '@shared/domain';
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
import { SchoolModule } from '@src/modules/school';
import { ToolModule } from '@src/modules/tool';
import { BoardModule } from '../board';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthProvider } from './feathers-auth.provider';
import { FeathersAuthorizationService } from './feathers-authorization.service';
import { FeathersJwtProvider } from './feathers-jwt.provider';
import { ReferenceLoader } from './reference.loader';

@Module({
	imports: [FeathersModule, LoggerModule, SchoolModule, ToolModule, BoardModule],
	providers: [
		FeathersAuthorizationService,
		FeathersAuthProvider,
		FeathersJwtProvider,
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
	],
	exports: [FeathersAuthorizationService, FeathersJwtProvider, AuthorizationService],
})
export class AuthorizationModule {}
