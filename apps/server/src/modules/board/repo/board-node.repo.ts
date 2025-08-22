import { FilterQuery, Utils } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { EntityId } from '@shared/domain/types';
import { v5 as uuidv5 } from 'uuid';
import { AnyBoardNode, BoardExternalReference, getBoardNodeType, RichTextElement } from '../domain';
import { pathOfChildren } from '../domain/path-utils';
import { BoardNodeEntity } from './entity/board-node.entity';
import { TreeBuilder } from './tree-builder';
@Injectable()
export class BoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	public async findById(id: EntityId, depth?: number): Promise<AnyBoardNode> {
		const props = await this.em.findOneOrFail(BoardNodeEntity, { id });
		const descendants = await this.findDescendants(props, depth);

		const builder = new TreeBuilder(descendants);
		const boardNode = builder.build(props);

		return boardNode;
	}

	public async findByIds(ids: EntityId[], depth?: number): Promise<AnyBoardNode[]> {
		const entities = await this.em.find(BoardNodeEntity, { id: { $in: ids } });

		// TODO refactor descendants mapping, more DRY?
		const descendantsMap = await this.findDescendantsOfMany(entities, depth);

		const boardNodes = entities.map((props) => {
			const descentants = descendantsMap[pathOfChildren(props)];
			const builder = new TreeBuilder(descentants);
			const boardNode = builder.build(props);

			return boardNode;
		});

		return boardNodes;
	}

	public async findByExternalReference(reference: BoardExternalReference, depth?: number): Promise<AnyBoardNode[]> {
		const entities = await this.em.find(BoardNodeEntity, {
			context: {
				_contextId: new ObjectId(reference.id),
				_contextType: reference.type,
			} as FilterQuery<BoardExternalReference>,
		});

		// TODO refactor descendants mapping, more DRY?
		const descendantsMap = await this.findDescendantsOfMany(entities, depth);

		const boardNodes = entities.map((props) => {
			const children = descendantsMap[pathOfChildren(props)];
			const builder = new TreeBuilder(children);
			const boardNode = builder.build(props);

			return boardNode;
		});

		return boardNodes;
	}

	public async findByContextExternalToolIds(
		contextExternalToolIds: EntityId[],
		depth?: number
	): Promise<AnyBoardNode[]> {
		const entities = await this.em.find(BoardNodeEntity, {
			contextExternalToolId: { $in: contextExternalToolIds },
		});

		// TODO refactor descendants mapping, more DRY?
		const descendantsMap = await this.findDescendantsOfMany(entities, depth);

		const boardNodes = entities.map((props) => {
			const children = descendantsMap[pathOfChildren(props)];
			const builder = new TreeBuilder(children);
			const boardNode = builder.build(props);

			return boardNode;
		});

		return boardNodes;
	}

	public async save(boardNode: AnyBoardNode | AnyBoardNode[]): Promise<void> {
		if (boardNode instanceof RichTextElement) {
			const client = new QdrantClient({ url: 'http://localhost:6333' });

			const collectionName = 'my_embeddings';
			const collections = await client.getCollections();
			const exists = collections.collections.some((c) => c.name === collectionName);

			if (!exists) {
				await client.createCollection(collectionName, {
					vectors: { size: 1024, distance: 'Cosine' }, // adjust size to your embedding dimension
				});
			}

			console.log('Saving boardNode with embedding:', boardNode.id);
			console.log(boardNode.embedding);

			await client.upsert(collectionName, {
				wait: true,
				points: [
					{
						id: uuidv5(boardNode.id, uuidv5.URL),
						vector: boardNode.embedding[0],
						payload: {
							svs_id: boardNode.id,
						},
					},
				],
			});
		}

		return this.persist(boardNode).flush();
	}

	public async delete(boardNode: AnyBoardNode | AnyBoardNode[]): Promise<void> {
		await this.remove(boardNode).flush();
	}

	private async findDescendants(props: BoardNodeEntity, depth?: number): Promise<BoardNodeEntity[]> {
		const levelQuery = depth !== undefined ? { $gt: props.level, $lte: props.level + depth } : { $gt: props.level };

		const descendants = await this.em.find(BoardNodeEntity, {
			path: { $re: `^${pathOfChildren(props)}` },
			level: levelQuery,
		});

		return descendants;
	}

	private async findDescendantsOfMany(
		entities: BoardNodeEntity[],
		depth?: number
	): Promise<Record<string, BoardNodeEntity[]>> {
		const pathQueries = entities.map((props) => {
			const levelQuery = depth !== undefined ? { $gt: props.level, $lte: props.level + depth } : { $gt: props.level };

			return { path: { $re: `^${pathOfChildren(props)}` }, level: levelQuery };
		});

		const map: Record<string, BoardNodeEntity[]> = {};
		if (pathQueries.length === 0) {
			return map;
		}

		const descendants = await this.em.find(BoardNodeEntity, {
			$or: pathQueries,
		});

		// this is for finding the ancestors of a descendant
		// we use this to group the descendants by ancestor
		// TODO we probably need a more efficient way to do the grouping
		const matchAncestors = (descendant: BoardNodeEntity): BoardNodeEntity[] => {
			const result = entities.filter((props) => descendant.path.match(`^${pathOfChildren(props)}`));
			return result;
		};

		for (const desc of descendants) {
			const ancestors = matchAncestors(desc);
			ancestors.forEach((props) => {
				map[pathOfChildren(props)] ||= [];
				map[pathOfChildren(props)].push(desc);
			});
		}
		return map;
	}

	private persist(boardNode: AnyBoardNode | AnyBoardNode[]): BoardNodeRepo {
		const boardNodes = Utils.asArray(boardNode);

		boardNodes.forEach((bn) => {
			bn.children.forEach((child) => this.persist(child));

			const props = this.getProps(bn);

			if (!(props instanceof BoardNodeEntity)) {
				const entity = this.em.create(BoardNodeEntity, props);
				entity.type = getBoardNodeType(bn);
				this.setProps(bn, entity);
				this.em.persist(entity);
			} else {
				// for the unlikely case that the props are not managed yet
				this.em.persist(props);
			}
		});

		return this;
	}

	private remove(boardNode: AnyBoardNode | AnyBoardNode[]): BoardNodeRepo {
		const boardNodes = Utils.asArray(boardNode);

		boardNodes.forEach((bn) => {
			this.em.remove(this.getProps(bn));
			bn.children.forEach((child) => this.remove(child));
		});

		return this;
	}

	private async flush(): Promise<void> {
		return this.em.flush();
	}

	private getProps(boardNode: AnyBoardNode): BoardNodeEntity {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { props } = boardNode;
		return props as BoardNodeEntity;
	}

	private setProps(boardNode: AnyBoardNode, props: BoardNodeEntity): void {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		boardNode.props = props;
	}
}
