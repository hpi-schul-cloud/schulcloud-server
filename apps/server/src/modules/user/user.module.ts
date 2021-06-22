import { Module } from '@nestjs/common';
// import { TaskController } from './controller/task.controller';
// import { TaskUC } from './uc/task.uc';
import { RoleRepo } from './repo/role.repo';

@Module({
	controllers: [],
	providers: [RoleRepo], // UC
})
export class UserModule {}
