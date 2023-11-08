import { ForbiddenException, forwardRef, Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
	AnyBoardDo,
	AnyContentElementDo,
	DrawingElement,
	EntityId,
	isSubmissionContainerElement,
	isSubmissionItem,
	SubmissionItem,
	UserRoleEnum,
} from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationService, Action } from '@modules/authorization';
import { AnyElementContentBody } from '../controller/dto';
import { BoardDoAuthorizableService, ContentElementService } from '../service';
import { SubmissionItemService } from '../service/submission-item.service';
import { BaseUc } from './base.uc';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

@Injectable()
export class ElementUc extends BaseUc {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly elementService: ContentElementService,
		private readonly submissionItemService: SubmissionItemService,
		private readonly logger: Logger,
		private readonly httpService: HttpService
	) {
		super(authorizationService, boardDoAuthorizableService);
		this.logger.setContext(ElementUc.name);
	}

	async updateElementContent(
		userId: EntityId,
		elementId: EntityId,
		content: AnyElementContentBody
	): Promise<AnyContentElementDo> {
		const element = await this.getElementWithWritePermission(userId, elementId);

		await this.elementService.update(element, content);
		return element;
	}

	async deleteElement(userId: EntityId, elementId: EntityId, auth: string): Promise<void> {
		const element = await this.getElementWithWritePermission(userId, elementId);

		await this.elementService.delete(element);

		if (element instanceof DrawingElement) {
			await firstValueFrom(
				this.httpService.delete(`${Configuration.get('TLDRAW_URI') as string}/tldraw-document/${element.drawingName}`, {
					headers: {
						Accept: 'Application/json',
						Authorization: auth,
					},
				})
			);
		}
	}

	private async getElementWithWritePermission(userId: EntityId, elementId: EntityId): Promise<AnyContentElementDo> {
		const element = await this.elementService.findById(elementId);

		const parent: AnyBoardDo = await this.elementService.findParentOfId(elementId);

		if (isSubmissionItem(parent)) {
			await this.checkSubmissionItemWritePermission(userId, parent);
		} else {
			await this.checkPermission(userId, element, Action.write);
		}

		return element;
	}

	async createSubmissionItem(
		userId: EntityId,
		contentElementId: EntityId,
		completed: boolean
	): Promise<SubmissionItem> {
		const submissionContainerElement = await this.elementService.findById(contentElementId);

		if (!isSubmissionContainerElement(submissionContainerElement)) {
			throw new UnprocessableEntityException('Cannot create submission-item for non submission-container-element');
		}

		if (!submissionContainerElement.children.every((child) => isSubmissionItem(child))) {
			throw new UnprocessableEntityException(
				'Children of submission-container-element must be of type submission-item'
			);
		}

		const userSubmissionExists = submissionContainerElement.children
			.filter(isSubmissionItem)
			.find((item) => item.userId === userId);
		if (userSubmissionExists) {
			throw new ForbiddenException(
				'User is not allowed to have multiple submission-items per submission-container-element'
			);
		}

		await this.checkPermission(userId, submissionContainerElement, Action.read, UserRoleEnum.STUDENT);

		const submissionItem = await this.submissionItemService.create(userId, submissionContainerElement, { completed });

		return submissionItem;
	}
}
