import { Module } from '@nestjs/common';
import { ClassModule } from '../class';
import { UserMikroOrmRepo } from './repo/user.repo';
import { USER_REPO } from './uc/interface/user.repo.interface';
import { UserListService } from './uc/user-list.service';

@Module({
	imports: [ClassModule],
	providers: [UserListService, { provide: USER_REPO, useClass: UserMikroOrmRepo }],
	exports: [UserListService],
})
export class UserManagementModule {}
