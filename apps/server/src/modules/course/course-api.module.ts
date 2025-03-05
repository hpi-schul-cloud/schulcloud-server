import { AuthorizationModule } from '@modules/authorization';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { CourseController, CourseUc } from './api';
import { CourseModule } from './course.module';

@Module({
	imports: [AuthorizationModule, CourseModule, RoleModule],
	controllers: [CourseController],
	providers: [CourseUc],
})
export class CourseApiModule {}
