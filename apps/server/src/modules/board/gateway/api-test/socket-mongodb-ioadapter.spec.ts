/* import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	richTextElementNodeFactory,
	userFactory,
} from '@shared/testing';
import { getSocketApiClient } from '@shared/testing/test-socket-api-client';
import { Socket } from 'socket.io-client';
import { BoardCollaborationTestingModule } from '../../board-collaboration.testing.module';
import { BoardCollaborationGateway } from '../board-collaboration.gateway';
import { MongoIoAdapter } from '../socket-mongodb-ioadapter';

describe(BoardCollaborationGateway.name, () => {
	let firstApp: INestApplication;
	let firstClient: Socket;
	let secondApp: INestApplication;
	let secondClient: Socket;
	let em: EntityManager;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [BoardCollaborationTestingModule],
		}).compile();
		firstApp = testingModule.createNestApplication();
		await firstApp.init();

		secondApp = testingModule.createNestApplication();
		await secondApp.init();

		em = firstApp.get(EntityManager);
		const mongoUrl = em.config.getClientUrl();

		const mongoIoAdapter = new MongoIoAdapter(nestApp);
		await mongoIoAdapter.connectToMongoDb(mongoUrl);

		nestApp.useWebSocketAdapter(mongoIoAdapter);

		await firstApp.listen(0);
	});

	afterAll(async () => {
		firstClient.disconnect();
		secondClient.disconnect();
		await firstApp.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const user = userFactory.buildWithId();

		const course = courseFactory.build({ teachers: [user] });
		await em.persistAndFlush([user, course]);

		firstClient = await getSocketApiClient(firstApp, user);
		secondClient = await getSocketApiClient(firstApp, user);

		const columnBoardNode = columnBoardNodeFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});

		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });
		const columnNode2 = columnNodeFactory.buildWithId({ parent: columnBoardNode });

		const cardNodes = cardNodeFactory.buildListWithId(2, { parent: columnNode });
		const elementNodes = richTextElementNodeFactory.buildListWithId(3, { parent: cardNodes[0] });

		await em.persistAndFlush([columnBoardNode, columnNode, columnNode2, ...cardNodes, ...elementNodes]);

		em.clear();

		return { user, columnBoardNode, columnNode, columnNode2, cardNodes, elementNodes };
	};

	it('should do something', async () => {});
});
 */
