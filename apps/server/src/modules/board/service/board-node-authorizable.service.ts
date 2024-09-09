import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import {
	type AuthorizationLoaderService,
	AuthorizationInjectionService,
	AuthorizableReferenceType,
} from '@modules/authorization';
import { AnyBoardNode, BoardNodeAuthorizable, UserWithBoardRoles } from '../domain';
import { BoardNodeRepo } from '../repo';
import { BoardContextService } from './internal/board-context.service';
import { BoardNodeService } from './board-node.service';

@Injectable()
export class BoardNodeAuthorizableService implements AuthorizationLoaderService {
	constructor(
		@Inject(forwardRef(() => BoardNodeRepo)) private readonly boardNodeRepo: BoardNodeRepo,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardContextService: BoardContextService,
		injectionService: AuthorizationInjectionService
	) {
		injectionService.injectReferenceLoader(AuthorizableReferenceType.BoardNode, this);
	}

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

	async getBoardAuthorizables(boardNodes: AnyBoardNode[]): Promise<BoardNodeAuthorizable[]> {
		const rootIds = boardNodes.map((node) => node.rootId);
		const parentIds = boardNodes.map((node) => node.parentId).filter((defined) => defined) as EntityId[];
		const boardNodeMap = await this.getBoardNodeMap([...rootIds, ...parentIds]);
		const promises = boardNodes.map((boardNode) => {
			const rootNode = boardNodeMap[boardNode.rootId];
			return this.boardContextService.getUsersWithBoardRoles(rootNode).then((users) => {
				return { id: boardNode.id, users };
			});
		});

		const results = await Promise.all(promises);
		const usersMap = results.reduce((acc, { id, users }) => {
			acc[id] = users;
			return acc;
		}, {} as Record<EntityId, UserWithBoardRoles[]>);

		const boardNodeAuthorizables = boardNodes.map((boardNode) => {
			const rootNode = boardNodeMap[boardNode.rootId];
			const parentNode = boardNode.parentId ? boardNodeMap[boardNode.parentId] : undefined;
			const users = usersMap[boardNode.id];
			const boardNodeAuthorizable = new BoardNodeAuthorizable({
				users,
				id: boardNode.id,
				boardNode,
				rootNode,
				parentNode,
			});
			return boardNodeAuthorizable;
		});

		return boardNodeAuthorizables;
	}

	private async getBoardNodeMap(ids: EntityId[]): Promise<Record<EntityId, AnyBoardNode>> {
		const idsUnique = Array.from(new Set(ids));
		const boardNodes = await this.boardNodeService.findByIds(idsUnique, 1);
		const nodesMap: Record<EntityId, AnyBoardNode> = boardNodes.reduce(
			(map: Record<EntityId, AnyBoardNode>, boardNode) => {
				map[boardNode.id] = boardNode;
				return map;
			},
			{} as Record<EntityId, AnyBoardNode>
		);
		return nodesMap;
	}
}
