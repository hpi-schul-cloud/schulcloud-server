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
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { FilesStorageProducer } from '@src/modules/files-storage-client/service/files-storage.producer';
import { SchoolModule } from '@src/modules/school';
import { ToolModule } from '@src/modules/tool';
import { BoardDoRepo, BoardNodeRepo, RecursiveDeleteVisitor } from '../board/repo';
import { BoardDoAuthorizableService } from '../board/service';
import { CourseService } from '../learnroom/service/course.service';
import { AuthorizationHelper } from './authorization.helper';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';
import { ReferenceLoader } from './reference.loader';
import { RuleManager } from './rule-manager';

@Module({
	imports: [FeathersModule, LoggerModule, SchoolModule, ToolModule],
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
		// TO DO: the following lines are needed to avoid DependencyCircles at least for Authorization in Board context //
		BoardDoAuthorizableService,
		CourseService,
		BoardDoRepo,
		BoardNodeRepo,
		RecursiveDeleteVisitor,
		FilesStorageClientAdapterService,
		FilesStorageProducer,
	],
	exports: [FeathersAuthorizationService, AuthorizationService],
})
export class AuthorizationModule {}
