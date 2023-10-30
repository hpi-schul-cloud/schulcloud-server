import { forwardRef, Module } from '@nestjs/common';
import { ALL_RULES } from '@shared/domain/rules/all-rules';
import { FeathersModule } from '@shared/infra/feathers/feathers.module';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { CourseGroupRepo } from '@shared/repo/coursegroup/coursegroup.repo';
import { LessonRepo } from '@shared/repo/lesson/lesson.repo';
import { LegacySchoolRepo } from '@shared/repo/school/legacy-school.repo';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { SubmissionRepo } from '@shared/repo/submission/submission.repo';
import { TaskRepo } from '@shared/repo/task/task.repo';
import { TeamsRepo } from '@shared/repo/teams/teams.repo';
import { UserRepo } from '@shared/repo/user/user.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { BoardModule } from '../board/board.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { ToolModule } from '../tool/tool.module';
import { AuthorizationHelper } from './authorization.helper';
import { AuthorizationService } from './authorization.service';
import { FeathersAuthProvider } from './feathers/feathers-auth.provider';
import { FeathersAuthorizationService } from './feathers/feathers-authorization.service';
import { ReferenceLoader } from './reference.loader';
import { RuleManager } from './rule-manager';

@Module({
	// TODO: remove forwardRef to TooModule N21-1055
	imports: [
		FeathersModule,
		LoggerModule,
		LegacySchoolModule,
		forwardRef(() => ToolModule),
		forwardRef(() => BoardModule),
	],
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
