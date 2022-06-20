import { Module } from '@nestjs/common';
import { NextcloudStrategy } from '@shared/infra/collaborative-storage/strategy/nextcloud.strategy';
import { CollaborativeStorageAdapterMapper } from '@shared/infra/collaborative-storage/mapper/collaborative-storage-adapter.mapper';
import { HttpModule } from '@nestjs/axios';
import { CollaborativeStorageAdapter } from './collaborative-storage.adapter';

@Module({
	imports: [HttpModule],
	providers: [CollaborativeStorageAdapter, CollaborativeStorageAdapterMapper],
	exports: [CollaborativeStorageAdapter, NextcloudStrategy],
})
export class CollaborativeStorageAdapterModule {}
