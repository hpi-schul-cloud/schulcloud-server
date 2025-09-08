import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SystemController, SystemUc } from './api';
import { SystemModule } from './system.module';

@Module({
	imports: [CqrsModule, SystemModule, AuthorizationModule],
	providers: [SystemUc],
	controllers: [SystemController],
})
export class SystemApiModule {}
