import {
	type AuthorizationLoaderService,
	AuthorizableReferenceType,
	AuthorizationInjectionService,
} from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import { AnyBoardNode, BoardConfiguration, BoardNodeAuthorizable, ColumnBoard, MediaBoard } from '../domain';
import { BoardNodeRepo } from '../repo';
import { BoardNodeService } from './board-node.service';
import { BoardContextResolverService } from './internal/board-context/board-context-resolver.service';
import { PreparedBoardContext } from './internal/board-context/prepared-board-context.interface';

@Injectable()
export class BoardNodeAuthorizableService implements AuthorizationLoaderService {
	constructor(
		@Inject(forwardRef(() => BoardNodeRepo)) private readonly boardNodeRepo: BoardNodeRepo,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardContextResolverService: BoardContextResolverService,
		injectionService: AuthorizationInjectionService
	) {
		injectionService.injectReferenceLoader(AuthorizableReferenceType.BoardNode, this);
	}

	/**
	 * @deprecated
	 */
	public async findById(id: EntityId): Promise<BoardNodeAuthorizable> {
		const boardNode = await this.boardNodeRepo.findById(id, 1);

		const boardNodeAuthorizable = this.getBoardAuthorizable(boardNode);

		return boardNodeAuthorizable;
	}

	public async getBoardAuthorizable(boardNode: AnyBoardNode): Promise<BoardNodeAuthorizable> {
		const rootNode = await this.boardNodeService.findRoot(boardNode, 1);
		const parentNode = await this.boardNodeService.findParent(boardNode, 1);

		const preparedContext = await this.resolveContext(rootNode);
		const users = preparedContext.getUsersWithBoardRoles();
		const boardConfiguration = preparedContext.getBoardConfiguration(rootNode as MediaBoard | ColumnBoard);

		const boardNodeAuthorizable = new BoardNodeAuthorizable({
			users,
			id: boardNode.id,
			boardNode,
			rootNode,
			parentNode,
			boardConfiguration,
		});

		return boardNodeAuthorizable;
	}

	public async getBoardAuthorizables(boardNodes: AnyBoardNode[]): Promise<BoardNodeAuthorizable[]> {
		const rootIds = boardNodes.map((node) => node.rootId);
		const parentIds = boardNodes.map((node) => node.parentId).filter((defined) => defined) as EntityId[];
		const boardNodeMap = await this.getBoardNodeMap([...rootIds, ...parentIds]);
		const rootNodeIds = Array.from(new Set(rootIds));
		const rootNodes = rootNodeIds.map((id) => boardNodeMap[id]);
		const uniqueRootNodeContextIds = Array.from(
			new Set(rootNodes.map((node) => ('context' in node ? node.context.id : undefined)))
		);
		if (uniqueRootNodeContextIds.length > 1) {
			throw new Error(
				'Multiple contexts found for board nodes. All board nodes must share the same context to load authorizables.'
			);
		}

		const preparedContext = await this.resolveContext(rootNodes[0]);
		const users = preparedContext.getUsersWithBoardRoles();

		const boardNodeAuthorizables = boardNodes.map((boardNode) => {
			const currentRootNode = boardNodeMap[boardNode.rootId];
			const parentNode = boardNode.parentId ? boardNodeMap[boardNode.parentId] : undefined;

			const boardConfiguration = preparedContext.getBoardConfiguration(currentRootNode as MediaBoard | ColumnBoard);

			return new BoardNodeAuthorizable({
				users,
				id: boardNode.id,
				boardNode,
				rootNode: currentRootNode,
				parentNode,
				boardConfiguration,
			});
		});

		return boardNodeAuthorizables;
	}

	private async resolveContext(rootNode: AnyBoardNode): Promise<PreparedBoardContext> {
		if (!rootNode || !('context' in rootNode)) {
			return {
				type: undefined as never,
				getUsersWithBoardRoles: () => [],
				getBoardConfiguration: (): BoardConfiguration => {
					return {};
				},
			};
		}

		return await this.boardContextResolverService.resolve(rootNode.context);
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
