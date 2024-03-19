import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { CourseService } from '@modules/learnroom/service';
import { ColumnBoardService } from '@modules/board/service';
import { LessonService } from '@modules/lesson/service';
import { TaskService } from '@modules/task/service';
import {
	ShareTokenContext,
	ShareTokenDO,
	ShareTokenParentType,
	ShareTokenPayload,
	ShareTokenString,
} from '../domainobject/share-token.do';
import { ShareTokenRepo } from '../repo/share-token.repo';
import { TokenGenerator } from './token-generator.service';

@Injectable()
export class ShareTokenService {
	constructor(
		private readonly tokenGenerator: TokenGenerator,
		private readonly shareTokenRepo: ShareTokenRepo,
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService,
		private readonly columnBoardService: ColumnBoardService
	) {}

	async createToken(
		payload: ShareTokenPayload,
		options?: { context?: ShareTokenContext; expiresAt?: Date }
	): Promise<ShareTokenDO> {
		const token = this.tokenGenerator.generateShareToken();
		const shareToken = new ShareTokenDO({
			token,
			payload,
			context: options?.context,
			expiresAt: options?.expiresAt,
		});

		await this.shareTokenRepo.save(shareToken);

		return shareToken;
	}

	async lookupToken(token: ShareTokenString): Promise<ShareTokenDO> {
		const shareToken = await this.shareTokenRepo.findOneByToken(token);

		this.checkExpired(shareToken);

		return shareToken;
	}

	async lookupTokenWithParentName(token: ShareTokenString): Promise<{ shareToken: ShareTokenDO; parentName: string }> {
		const shareToken = await this.lookupToken(token);

		let parentName = '';
		switch (shareToken.payload.parentType) {
			case ShareTokenParentType.Course:
				parentName = (await this.courseService.findById(shareToken.payload.parentId)).name;
				break;
			case ShareTokenParentType.Lesson:
				parentName = (await this.lessonService.findById(shareToken.payload.parentId)).name;
				break;
			case ShareTokenParentType.Task:
				parentName = (await this.taskService.findById(shareToken.payload.parentId)).name;
				break;
			case ShareTokenParentType.ColumnBoard:
				parentName = (await this.columnBoardService.findById(shareToken.payload.parentId)).title;
				break;
			default:
				throw new UnprocessableEntityException('Invalid parent type');
		}

		return { shareToken, parentName };
	}

	private checkExpired(shareToken: ShareTokenDO) {
		if (shareToken.expiresAt != null && shareToken.expiresAt < new Date(Date.now())) {
			throw new Error('Share token expired');
		}
	}
}
