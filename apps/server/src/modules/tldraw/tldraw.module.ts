import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions, DB_PASSWORD, DB_USERNAME, TLDRAW_DB_URL } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TldrawDrawing } from '@src/modules/tldraw/entities';
import { defaultMikroOrmOptions } from '@src/modules/server';
import { TldrawService } from '@src/modules/tldraw/service/tldraw.service';
import { TldrawRepo } from '@src/modules/tldraw/repo/tldraw.repo';
import { config } from './config';

@Module({
	imports: [
		CoreModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			contextName: 'tldraw_db',
			clientUrl: TLDRAW_DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [TldrawDrawing],
		}),
	],
	providers: [Logger, TldrawService, TldrawRepo],
	exports: [TldrawService],
})
export class TldrawModule {}
