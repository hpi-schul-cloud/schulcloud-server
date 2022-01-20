import { Module } from '@nestjs/common';
import { PermissionService } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { UserController } from './controller';

@Module({
	controllers: [UserController],
	providers: [UserRepo, PermissionService],
})
export class UserModule {}
