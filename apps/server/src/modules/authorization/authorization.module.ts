import { Module } from '@nestjs/common';
import { ALL_RULES } from '@shared/domain';
import { FeathersModule } from '@shared/infra/feathers';
import {
	CourseGroupRepo,
	CourseRepo,
	FileRecordRepo,
	LessonRepo,
	SchoolRepo,
	SubmissionRepo,
	TaskRepo,
	TeamRepo,
	UserRepo,
} from '@shared/repo';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthProvider } from './feathers-auth.provider';
import { FeathersAuthorizationService } from './feathers-authorization.service';
import { FeathersJwtProvider } from './feathers-jwt.provider';
import { ReferenceLoader } from './reference.loader';

@Module({
	imports: [FeathersModule],
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
		FileRecordRepo,
		SchoolRepo,
		LessonRepo,
		TeamRepo,
		SubmissionRepo,
	],
	exports: [FeathersAuthorizationService, FeathersJwtProvider, AuthorizationService],
})
export class AuthorizationModule {}
