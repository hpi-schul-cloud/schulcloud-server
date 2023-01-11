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
	SchoolExternalToolRepo,
} from '@shared/repo';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthProvider } from './feathers-auth.provider';
import { FeathersAuthorizationService } from './feathers-authorization.service';
import { FeathersJwtProvider } from './feathers-jwt.provider';
import { ReferenceLoader } from './reference.loader';
import { LoggerModule } from '../../core/logger';
import { SchoolModule } from '../school';

@Module({
	imports: [FeathersModule, LoggerModule, SchoolModule],
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
		ExternalToolRepoMapper,
	],
	exports: [FeathersAuthorizationService, FeathersJwtProvider, AuthorizationService],
})
export class AuthorizationModule {}
