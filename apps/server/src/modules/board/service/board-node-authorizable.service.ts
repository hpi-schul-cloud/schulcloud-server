import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import { type AuthorizationLoaderService } from '@modules/authorization';
import { AnyBoardNode, BoardNodeAuthorizable } from '../domain';
import { BoardNodeRepo } from '../repo';
import { BoardContextService } from './internal/board-context.service';
import { BoardNodeService } from './board-node.service';

@Injectable()
export class BoardNodeAuthorizableService implements AuthorizationLoaderService {
	constructor(
		@Inject(forwardRef(() => BoardNodeRepo)) private readonly boardNodeRepo: BoardNodeRepo,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardContextService: BoardContextService
	) {}

	/**
	 * @deprecated
	 */
	async findById(id: EntityId): Promise<BoardNodeAuthorizable> {
		const boardNode = await this.boardNodeRepo.findById(id, 1);

		const boardNodeAuthorizable = this.getBoardAuthorizable(boardNode);

		return boardNodeAuthorizable;
	}

	async getBoardAuthorizable(boardNode: AnyBoardNode): Promise<BoardNodeAuthorizable> {
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
