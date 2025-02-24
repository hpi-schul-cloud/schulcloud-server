import { Logger } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	DataDeletedEvent,
	DataDeletionDomainOperationLoggable,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
	UserDeletedEvent,
} from '@modules/deletion';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { UserDo } from '@modules/user/domain';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Page, Pseudonym } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { v4 as uuidv4 } from 'uuid';
import { PseudonymSearchQuery } from '../domain';
import { ExternalToolPseudonymRepo } from '../repo';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class PseudonymService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly externalToolPseudonymRepo: ExternalToolPseudonymRepo,
		private readonly logger: Logger,
		private readonly eventBus: EventBus,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(PseudonymService.name);
	}

	@UseRequestContext()
	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);

		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public async findByUserAndToolOrThrow(user: UserDo, tool: ExternalTool): Promise<Pseudonym> {
		if (!user.id || !tool.id) {
			throw new InternalServerErrorException('User or tool id is missing');
		}

		const pseudonym = await this.externalToolPseudonymRepo.findByUserIdAndToolIdOrFail(user.id, tool.id);

		return pseudonym;
	}

	public async findByUserId(userId: string): Promise<Pseudonym[]> {
		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		const pseudonyms = await this.externalToolPseudonymRepo.findByUserId(userId);

		return pseudonyms;
	}

	public async findOrCreatePseudonym(user: UserDo, tool: ExternalTool): Promise<Pseudonym> {
		if (!user.id || !tool.id) {
			throw new InternalServerErrorException('User or tool id is missing');
		}

		let pseudonym = await this.externalToolPseudonymRepo.findByUserIdAndToolId(user.id, tool.id);
		if (!pseudonym) {
			pseudonym = new Pseudonym({
				id: new ObjectId().toHexString(),
				pseudonym: uuidv4(),
				userId: user.id,
				toolId: tool.id,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			pseudonym = await this.externalToolPseudonymRepo.createOrUpdate(pseudonym);
		}

		return pseudonym;
	}

	public async deleteUserData(userId: string): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Pseudonyms',
				DomainName.PSEUDONYMS,
				userId,
				StatusModel.PENDING
			)
		);
		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		const deletedPseudonymIds = await this.externalToolPseudonymRepo.deletePseudonymsByUserId(userId);

		const result = DomainDeletionReportBuilder.build(DomainName.PSEUDONYMS, [
			DomainOperationReportBuilder.build(OperationType.DELETE, deletedPseudonymIds.length, deletedPseudonymIds),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from Pseudonyms',
				DomainName.PSEUDONYMS,
				userId,
				StatusModel.FINISHED,
				0,
				deletedPseudonymIds.length
			)
		);

		return result;
	}

	public async findPseudonymByPseudonym(pseudonym: string): Promise<Pseudonym | null> {
		const result = await this.externalToolPseudonymRepo.findPseudonymByPseudonym(pseudonym);

		return result;
	}

	public async findPseudonym(query: PseudonymSearchQuery, options: IFindOptions<Pseudonym>): Promise<Page<Pseudonym>> {
		const result = await this.externalToolPseudonymRepo.findPseudonym(query, options);

		return result;
	}

	public getIframeSubject(pseudonym: string): string {
		const iFrameSubject = `<iframe src="${
			Configuration.get('HOST') as string
		}/oauth2/username/${pseudonym}" title="username" style="height: 26px; width: 180px; border: none;"></iframe>`;

		return iFrameSubject;
	}
}
