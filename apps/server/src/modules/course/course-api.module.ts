import { AuthorizationModule } from '@modules/authorization';
import { ClassModule } from '@modules/class';
import { GroupModule } from '@modules/group';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { CourseController, CourseInfoController, CourseInfoUc, CourseSyncUc, CourseUc } from './api';
import { CourseModule } from './course.module';
import { DeletionModule } from '@modules/deletion';

@Module({
	imports: [
		AuthorizationModule,
		CourseModule,
		RoleModule,
		SchoolModule,
		GroupModule,
		UserModule,
		ClassModule,
		DeletionModule,
	],
	controllers: [CourseController, CourseInfoController],
	providers: [CourseUc, CourseInfoUc, CourseSyncUc],
})
export class CourseApiModule {}
