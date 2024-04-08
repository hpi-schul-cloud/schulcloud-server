import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions, DB_PASSWORD, DB_USERNAME } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { CoreModule } from '@src/core';
import { config, TLDRAW_DB_URL } from './config';
import { TldrawDrawing } from './entities';
import { TldrawController } from './controller';
import { TldrawService } from './service';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from './repo';
// TODO must be fixed, direct import of a file from another module in not allowed
import { XApiKeyStrategy } from '../authentication/strategy/x-api-key.strategy';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

@Module({
	imports: [
		LoggerModule,
		CoreModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: TLDRAW_DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [TldrawDrawing],
		}),
		ConfigModule.forRoot(createConfigModuleOptions(config)),
	],
	providers: [TldrawService, TldrawBoardRepo, TldrawRepo, YMongodb, XApiKeyStrategy],
	controllers: [TldrawController],
})
export class TldrawApiModule {}
