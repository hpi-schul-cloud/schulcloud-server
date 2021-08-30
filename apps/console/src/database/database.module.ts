import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { SpawnModule } from './spawn/spawn.module';

@Module({
	imports: [SpawnModule],
	providers: [DatabaseService],
	controllers: [DatabaseController],
})
export class DatabaseModule {}
