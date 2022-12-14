import { Module } from '@nestjs/common';
import { ALL_RULES } from '@shared/domain';
import { FeathersModule } from '@shared/infra/feathers';
import {
	CourseGroupRepo,
	CourseRepo,
	LessonRepo,
	SchoolRepo,
	SubmissionRepo,
	TaskRepo,
	TeamsRepo,
	UserRepo,
} from '@shared/repo';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthProvider } from './feathers-auth.provider';
import { FeathersAuthorizationService } from './feathers-authorization.service';
import { FeathersJwtProvider } from './feathers-jwt.provider';
import { ReferenceLoader } from './reference.loader';
import { Logger, LoggerModule } from '../../core/logger';

@Module({
	imports: [FeathersModule, LoggerModule],
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
		Logger,
	],
	exports: [FeathersAuthorizationService, FeathersJwtProvider, AuthorizationService],
})
export class AuthorizationModule {}
