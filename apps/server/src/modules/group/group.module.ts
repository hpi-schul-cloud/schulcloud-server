import { CourseModule } from '@modules/course';
import { SchoolModule } from '@modules/school';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoleModule } from '../role';
import { UserModule } from '../user';
import { GroupRepo } from './repo';
import { CourseSyncService } from './service/course-sync.service';
import { GroupService } from './service/group.service';

@Module({
	imports: [UserModule, RoleModule, CqrsModule, SchoolModule, RoleModule, forwardRef(() => CourseModule)],
	providers: [GroupRepo, GroupService, CourseSyncService],
	exports: [GroupService, CourseSyncService],
})
export class GroupModule {}
