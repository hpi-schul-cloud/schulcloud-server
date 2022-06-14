import { Module } from '@nestjs/common';
import { TeamStorageAdapter } from './team-storage.adapter';
import {NextcloudStrategy} from "@shared/infra/team-storage/strategy/nextcloud.strategy";
import {TeamStorageAdapterMapper} from "@shared/infra/team-storage/mapper/team-storage-adapter.mapper";
import {HttpModule} from "@nestjs/axios";

@Module({
	imports: [HttpModule],
	providers: [TeamStorageAdapter, TeamStorageAdapterMapper],
	exports: [TeamStorageAdapter, NextcloudStrategy],
})
export class TeamStorageAdapterModule {}
