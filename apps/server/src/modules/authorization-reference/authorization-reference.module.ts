import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { InstanceModule } from '@modules/instance';
import { SubmissionRepo, TaskRepo } from '@modules/task/repo';
import { Module } from '@nestjs/common';
import { AuthorizationReferenceService, ReferenceLoader } from './domain';

/**
 * This module is part of an intermediate state. In the future it should be replaced by an AuthorizationApiModule.
 * For now it is used where the authorization itself needs to load data from the database.
 * Avoid using this module and load the needed data in your use cases and then use the normal AuthorizationModule!
 */
@Module({
	imports: [AuthorizationModule, LoggerModule, InstanceModule],
	providers: [ReferenceLoader, TaskRepo, SubmissionRepo, AuthorizationReferenceService],
	exports: [AuthorizationReferenceService],
})
export class AuthorizationReferenceModule {}
