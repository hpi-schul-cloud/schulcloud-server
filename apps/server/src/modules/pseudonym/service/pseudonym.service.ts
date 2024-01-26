import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LtiToolDO, Page, Pseudonym, UserDO } from '@shared/domain/domainobject';
import { DomainOperation, IFindOptions } from '@shared/domain/interface';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { PseudonymSearchQuery } from '../domain';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from '../repo';

@Injectable()
export class PseudonymService {
	constructor(
		private readonly pseudonymRepo: PseudonymsRepo,
		private readonly externalToolPseudonymRepo: ExternalToolPseudonymRepo,
		private readonly logger: Logger
	) {
		this.logger.setContext(PseudonymService.name);
	}

	public async findByUserAndToolOrThrow(user: UserDO, tool: ExternalTool | LtiToolDO): Promise<Pseudonym> {
		if (!user.id || !tool.id) {
			throw new InternalServerErrorException('User or tool id is missing');
		}

		const pseudonymPromise: Promise<Pseudonym> = this.getRepository(tool).findByUserIdAndToolIdOrFail(user.id, tool.id);

		return pseudonymPromise;
	}

	public async findByUserId(userId: string): Promise<Pseudonym[]> {
		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		let [pseudonyms, externalToolPseudonyms] = await Promise.all([
			this.findPseudonymsByUserId(userId),
			this.findExternalToolPseudonymsByUserId(userId),
		]);

		if (pseudonyms === undefined) {
			pseudonyms = [];
		}

		if (externalToolPseudonyms === undefined) {
			externalToolPseudonyms = [];
		}

		const allPseudonyms = [...pseudonyms, ...externalToolPseudonyms];

		return allPseudonyms;
	}

	public async findOrCreatePseudonym(user: UserDO, tool: ExternalTool | LtiToolDO): Promise<Pseudonym> {
		if (!user.id || !tool.id) {
			throw new InternalServerErrorException('User or tool id is missing');
		}

		const repository: PseudonymsRepo | ExternalToolPseudonymRepo = this.getRepository(tool);

		let pseudonym: Pseudonym | null = await repository.findByUserIdAndToolId(user.id, tool.id);
		if (!pseudonym) {
			pseudonym = new Pseudonym({
				id: new ObjectId().toHexString(),
				pseudonym: uuidv4(),
				userId: user.id,
				toolId: tool.id,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			pseudonym = await repository.createOrUpdate(pseudonym);
		}

		return pseudonym;
	}

	public async deleteByUserId(userId: string): Promise<DomainOperation> {
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

		const [deletedPseudonyms, deletedExternalToolPseudonyms] = await Promise.all([
			this.deletePseudonymsByUserId(userId),
			this.deleteExternalToolPseudonymsByUserId(userId),
		]);

		const numberOfDeletedPseudonyms = deletedPseudonyms.length + deletedExternalToolPseudonyms.length;

		const result = DomainOperationBuilder.build(
			DomainName.PSEUDONYMS,
			OperationType.DELETE,
			numberOfDeletedPseudonyms,
			[...deletedPseudonyms, ...deletedExternalToolPseudonyms]
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from Pseudonyms',
				DomainName.PSEUDONYMS,
				userId,
				StatusModel.FINISHED,
				0,
				numberOfDeletedPseudonyms
			)
		);

		return result;
	}

	private async findPseudonymsByUserId(userId: string): Promise<Pseudonym[]> {
		const pseudonymPromise: Promise<Pseudonym[]> = this.pseudonymRepo.findByUserId(userId);

		return pseudonymPromise;
	}

	private async findExternalToolPseudonymsByUserId(userId: string): Promise<Pseudonym[]> {
		const externalToolPseudonymPromise: Promise<Pseudonym[]> = this.externalToolPseudonymRepo.findByUserId(userId);

		return externalToolPseudonymPromise;
	}

	private async deletePseudonymsByUserId(userId: string): Promise<EntityId[]> {
		const pseudonymPromise: Promise<EntityId[]> = this.pseudonymRepo.deletePseudonymsByUserId(userId);

		return pseudonymPromise;
	}

	private async deleteExternalToolPseudonymsByUserId(userId: string): Promise<EntityId[]> {
		const externalToolPseudonymPromise: Promise<EntityId[]> =
			this.externalToolPseudonymRepo.deletePseudonymsByUserId(userId);

		return externalToolPseudonymPromise;
	}

	private getRepository(tool: ExternalTool | LtiToolDO): PseudonymsRepo | ExternalToolPseudonymRepo {
		if (tool instanceof ExternalTool) {
			return this.externalToolPseudonymRepo;
		}

		return this.pseudonymRepo;
	}

	async findPseudonymByPseudonym(pseudonym: string): Promise<Pseudonym | null> {
		const result: Pseudonym | null = await this.externalToolPseudonymRepo.findPseudonymByPseudonym(pseudonym);

		return result;
	}

	async findPseudonym(query: PseudonymSearchQuery, options: IFindOptions<Pseudonym>): Promise<Page<Pseudonym>> {
		const result: Page<Pseudonym> = await this.externalToolPseudonymRepo.findPseudonym(query, options);

		return result;
	}

	getIframeSubject(pseudonym: string): string {
		const iFrameSubject = `<iframe src="${
			Configuration.get('HOST') as string
		}/oauth2/username/${pseudonym}" title="username" style="height: 26px; width: 180px; border: none;"></iframe>`;

		return iFrameSubject;
	}
}
