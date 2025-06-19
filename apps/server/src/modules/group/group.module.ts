import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SchoolModule } from '@modules/school';
import { SagaModule } from '@modules/saga';
import { RoleModule } from '../role';
import { UserModule } from '../user';
import { GroupRepo } from './repo';
import { GroupService } from './service';
import { DeleteUserGroupDataStep } from './saga/delete-user-group-data.step';
import { LoggerModule } from '@core/logger';

@Module({
	imports: [forwardRef(() => UserModule), RoleModule, CqrsModule, LoggerModule, SchoolModule, SagaModule],
	providers: [GroupRepo, GroupService, DeleteUserGroupDataStep],
	exports: [GroupService],
})
export class GroupModule {}
