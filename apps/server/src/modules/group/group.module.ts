import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GroupRepo } from './repo';
import { GroupService } from './service';
import { UserModule } from '../user';
import { RoleModule } from '../role';

@Module({
	imports: [UserModule, RoleModule, CqrsModule],
	providers: [GroupRepo, GroupService],
	exports: [GroupService],
})
export class GroupModule {}
