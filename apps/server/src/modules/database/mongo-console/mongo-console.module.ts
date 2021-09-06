import { DynamicModule, Module } from '@nestjs/common';
import { MongoConsoleService } from './mongo-console.service';
import { MongoConsoleController } from './mongo-console.controller';
import { MongoConsoleOptions } from './mongo-console-options.interface';

@Module({})
export class MongoConsoleModule {
	static forRoot(options?: MongoConsoleOptions): DynamicModule {
		if (options != null && options.publish === true) {
			return {
				module: MongoConsoleModule,
				providers: [MongoConsoleService],
				controllers: [MongoConsoleController],
			};
		}
		return {
			module: MongoConsoleModule,
		};
	}
}
