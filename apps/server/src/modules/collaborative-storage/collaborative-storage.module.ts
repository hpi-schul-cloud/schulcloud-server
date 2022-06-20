import { Module } from '@nestjs/common';
import { CollaborativeStorageAdapterModule } from '@shared/infra/collaborative-storage/collaborative-storage-adapter.module';
import { RoleRepo, TeamsRepo } from '@shared/repo';
import { CollaborativeStorageAdapter } from '@shared/infra/collaborative-storage';
import { AuthorizationModule } from '@src/modules/authorization';
import { CollaborativeStorageUc } from './uc/collaborative-storage.uc';
import { CollaborativeStorageController } from './controller/collaborative-storage.controller';

@Module({
	imports: [CollaborativeStorageAdapterModule, AuthorizationModule],
	providers: [RoleRepo, TeamsRepo, CollaborativeStorageAdapter, CollaborativeStorageUc],
	controllers: [CollaborativeStorageController],
	exports: [CollaborativeStorageUc],
})
export class CollaborativeStorageModule {}
