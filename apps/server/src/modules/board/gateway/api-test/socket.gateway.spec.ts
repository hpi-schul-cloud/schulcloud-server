import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { BoardExternalReferenceType, CardProps } from '@shared/domain/domainobject';
import {
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	mapUserToCurrentUser,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { WsJwtAuthGuard } from '@src/modules/authentication/guard/ws-jwt-auth.guard';
import { Request } from 'express';
import { Socket, io } from 'socket.io-client';
import { BoardCollaborationTestingModule } from '../../board-collaboration.testing.module';
import { SocketGateway } from '../socket.gateway';

describe('SocketGateway', () => {
	let gateway: SocketGateway;
	let app: INestApplication;
	let ioClient: Socket;
	let em: EntityManager;
	let currentUser: ICurrentUser;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [BoardCollaborationTestingModule],
		})
			.overrideGuard(WsJwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
					const req: Request = context.switchToWs().getClient().handshake;
					req.user = currentUser;
					return true;
				},
			})
			.compile();
		app = testingModule.createNestApplication();

		em = app.get<EntityManager>(EntityManager);
		gateway = app.get<SocketGateway>(SocketGateway);

		/* client = new TestSocketClient(app); */

		ioClient = io('http://localhost:3031', {
			autoConnect: false,
			path: '/collaboration',
			transports: ['websocket', 'polling'],
		});

		await app.listen(3031);
	});

	afterAll(async () => {
		await app.close();
	});

	it('should be defined', () => {
		expect(gateway).toBeDefined();
	});

	describe('create card', () => {
		const setup = async () => {
			await cleanupCollections(em);
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });
			await em.persistAndFlush([user, course]);

			const columnBoardNode = columnBoardNodeFactory.buildWithId({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});

			const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });

			await em.persistAndFlush([columnBoardNode, columnNode]);
			em.clear();

			return { user, columnBoardNode, columnNode };
		};

		it('should answer with new card', async () => {
			const { user, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);
			ioClient.connect();

			ioClient.emit('create-card-request', { columnId: columnNode.id });

			await new Promise<void>((resolve) => {
				ioClient.on('create-card-success', (data: { newCard: CardProps; columnId: string }) => {
					expect(data?.newCard).toEqual(expect.objectContaining({ id: expect.any(String) }));
					resolve();
				});
			});
			ioClient.disconnect();
		});
	});
});
