import { SchoolModule } from '@modules/school';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RoleModule } from '../role';
import { UserModule } from '../user';
import { GroupRepo } from './repo';
import { GroupService } from './service';

@Module({
	imports: [forwardRef(() => UserModule), RoleModule, CqrsModule, SchoolModule],
	providers: [GroupRepo, GroupService],
	exports: [GroupService],
})
export class GroupModule {}
