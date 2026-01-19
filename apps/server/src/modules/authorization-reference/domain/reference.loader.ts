// TODO fix modules circular dependency
import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderService,
} from '@modules/authorization';
import { InstanceService } from '@modules/instance';
import { SubmissionRepo, TaskRepo } from '@modules/task/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { BaseDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class ReferenceLoader {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly submissionRepo: SubmissionRepo,
		private readonly instanceService: InstanceService,
		private readonly authorizationInjectionService: AuthorizationInjectionService
	) {
		const service = this.authorizationInjectionService;
		service.injectReferenceLoader(AuthorizableReferenceType.Task, this.taskRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.Submission, this.submissionRepo);
		service.injectReferenceLoader(AuthorizableReferenceType.Instance, this.instanceService);
	}

	private resolveLoader(type: AuthorizableReferenceType): AuthorizationLoaderService {
		const repo = this.authorizationInjectionService.getReferenceLoader(type);
		if (repo) {
			return repo;
		}
		throw new NotImplementedException('REPO_OR_SERVICE_NOT_IMPLEMENT');
	}

	public async loadAuthorizableObject(
		objectName: AuthorizableReferenceType,
		objectId: EntityId
	): Promise<AuthorizableObject | BaseDO> {
		const referenceLoader: AuthorizationLoaderService = this.resolveLoader(objectName);
		const object = await referenceLoader.findById(objectId);

		return object;
	}
}
