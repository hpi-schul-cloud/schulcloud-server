import { Module } from '@nestjs/common';
import { NextcloudStrategy } from '@shared/infra/team-storage/strategy/nextcloud.strategy';
import { TeamStorageAdapterMapper } from '@shared/infra/team-storage/mapper/team-storage-adapter.mapper';
import { HttpModule } from '@nestjs/axios';
import { TeamStorageAdapter } from './team-storage.adapter';

@Module({
	imports: [HttpModule],
	providers: [TeamStorageAdapter, TeamStorageAdapterMapper],
	exports: [TeamStorageAdapter, NextcloudStrategy],
})
export class TeamStorageAdapterModule {}
