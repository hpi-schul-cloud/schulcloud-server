import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import { type AuthorizationLoaderService } from '@src/modules/authorization';
import { BoardNodeAuthorizable } from '../domain';
import { BoardNodeRepo } from '../repo';
import { BoardContextService } from './board-context.service';
import { BoardNodeService } from './board.node.service';

@Injectable()
export class BoardNodeAuthorizableService implements AuthorizationLoaderService {
	constructor(
		@Inject(forwardRef(() => BoardNodeRepo)) private readonly boardNodeRepo: BoardNodeRepo,
		@Inject() private readonly boardNodeService: BoardNodeService,
		@Inject() private readonly boardContextService: BoardContextService
	) {}

	async findById(id: EntityId): Promise<BoardNodeAuthorizable> {
		const boardNode = await this.boardNodeRepo.findById(id, 1);
		const rootNode = await this.boardNodeService.findRoot(boardNode, 1);
		const parentNode = await this.boardNodeService.findParent(boardNode, 1);
		const users = await this.boardContextService.getUsersWithBoardRoles(rootNode);

		const boardNodeAuthorizable = new BoardNodeAuthorizable({
			users,
			id: boardNode.id,
			boardNode,
			rootNode,
			parentNode,
		});

		return boardNodeAuthorizable;
	}
}
