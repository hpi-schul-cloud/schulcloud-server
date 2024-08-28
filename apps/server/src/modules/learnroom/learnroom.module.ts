import { AccountModule } from '@modules/account';
import { BoardModule } from '@modules/board';
import { ClassModule } from '@modules/class';
import { CopyHelperModule } from '@modules/copy-helper';
import { GroupService } from '@modules/group';
import { GroupRepo } from '@modules/group/repo';
import { LessonModule } from '@modules/lesson';
import { RegistrationPinModule } from '@modules/registration-pin';
import { RoleModule } from '@modules/role';
import { SchoolService } from '@modules/school';
import { SCHOOL_REPO } from '@modules/school/domain/interface';
import { SystemModule } from '@modules/system';
import { TaskModule } from '@modules/task';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { UserModule, UserService } from '@modules/user';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import {
	CourseGroupRepo,
	CourseRepo,
	DashboardElementRepo,
	DashboardModelMapper,
	DashboardRepo,
	LegacyBoardRepo,
	UserRepo,
} from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { LoggerModule } from '@src/core/logger';
import { CalendarModule } from '../../infra/calendar';
import { BoardNodeRepo } from '../board/repo';
import { SchoolMikroOrmRepo } from '../school/repo/mikro-orm/school.repo';
import { COURSE_REPO } from './domain';
import { CommonCartridgeExportMapper } from './mapper/common-cartridge-export.mapper';
import { CommonCartridgeImportMapper } from './mapper/common-cartridge-import.mapper';
import { ColumnBoardNodeRepo } from './repo';
import { CourseMikroOrmRepo } from './repo/mikro-orm/course.repo';
import {
	BoardCopyService,
	CommonCartridgeExportService,
	CommonCartridgeImportService,
	CourseCopyService,
	CourseDoService,
	CourseGroupService,
	CourseService,
	DashboardService,
	GroupDeletedHandlerService,
	CourseRoomsService,
} from './service';
import { CommonCartridgeFileValidatorPipe } from './utils';

/**
 * @deprecated - the learnroom module is deprecated and will be removed in the future
 * it will be replaced by the new rooms module
 */
@Module({
	imports: [
		forwardRef(() => BoardModule),
		CopyHelperModule,
		ContextExternalToolModule,
		LessonModule,
		LoggerModule,
		TaskModule,
		CqrsModule,
		SystemModule,
		UserModule,
		RoleModule,
		ClassModule,
		AccountModule,
		RegistrationPinModule,
		CalendarModule,
	],
	providers: [
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
		BoardCopyService,
		BoardNodeRepo,
		CommonCartridgeExportService,
		CommonCartridgeFileValidatorPipe,
		CommonCartridgeImportService,
		CommonCartridgeExportMapper,
		CommonCartridgeImportMapper,
		CourseCopyService,
		CourseGroupRepo,
		CourseGroupService,
		CourseRepo,
		{
			provide: COURSE_REPO,
			useClass: CourseMikroOrmRepo,
		},
		CourseService,
		CourseDoService,
		GroupRepo,
		GroupService,
		DashboardElementRepo,
		DashboardModelMapper,
		DashboardService,
		LegacyBoardRepo,
		CourseRoomsService,
		UserRepo,
		GroupDeletedHandlerService,
		ColumnBoardNodeRepo,
		SchoolService,
		{
			provide: SCHOOL_REPO,
			useClass: SchoolMikroOrmRepo,
		},
		UserService,
		UserRepo,
		UserDORepo,
	],
	exports: [
		CourseCopyService,
		CourseService,
		CourseDoService,
		CourseRoomsService,
		CommonCartridgeExportService,
		CommonCartridgeImportService,
		CourseGroupService,
		DashboardService,
	],
})
export class LearnroomModule {}
