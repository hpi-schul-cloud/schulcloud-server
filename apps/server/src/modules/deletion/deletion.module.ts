import { Module } from '@nestjs/common';
// import { Module, NotFoundException } from '@nestjs/common';
// import { DB_PASSWORD, DB_USERNAME, DEL_DB_URL } from '@src/config';
// import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
// import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
// import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
// import { AuthorizationModule } from '@src/modules';
// import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq';
// import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { DeletionRequestService } from './services/deletion-request.service';
import { DeletionRequestRepo } from './repo/deletion-request.repo';

// const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
// 	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
// 		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
// 		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
// };

@Module({
	// imports: [
	// 	AuthorizationModule,
	// 	AuthenticationModule,
	// 	CoreModule,
	// 	RabbitMQWrapperTestModule,
	// 	MikroOrmModule.forRoot({
	// 		...defaultMikroOrmOptions,
	// 		type: 'mongo',
	// 		clientUrl: DEL_DB_URL,
	// 		password: DB_PASSWORD,
	// 		user: DB_USERNAME,
	// 		entities: [],
	// 	}),
	// ConfigModule.forRoot(createConfigModuleOptions(config)),
	// ],
	providers: [Logger, DeletionRequestService, DeletionRequestRepo],
})
export class DeletionModule {}
