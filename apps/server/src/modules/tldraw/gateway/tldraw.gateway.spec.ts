import { Test, TestingModule } from '@nestjs/testing';
import { TldrawGateway } from './tldraw.gateway';
import { TextEncoder } from 'util';

const message = 'AZQBAaCbuLANBIsBeyJ0ZFVzZXIiOnsiaWQiOiJkNGIxZThmYi0yMWUwLTQ3ZDAtMDI0YS0zZGEwYjMzNjQ3MjIiLCJjb2xvciI6IiNGMDRGODgiLCJwb2ludCI6WzAsMF0sInNlbGVjdGVkSWRzIjpbXSwiYWN0aXZlU2hhcGVzIjpbXSwic2Vzc2lvbiI6ZmFsc2V9fQ==';

describe('TlDrawConnection', () => {
	let tldrawGateway: TldrawGateway;
	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			providers: [TldrawGateway],
		}).compile();

		tldrawGateway = moduleFixture.get<TldrawGateway>(TldrawGateway);
	});

	it('should handle message method', () => {
		var encoder = new TextEncoder();
		const data = encoder.encode(message); // Mock message data
		const client = { client: { conn: {readyState: 'open' } }, send(data, err){} };
		tldrawGateway.doc = {}; // Mock doc object

		const messageHandlerSpy = jest.spyOn(tldrawGateway, 'handleMessage');
		tldrawGateway.handleMessage(data, client);

		expect(messageHandlerSpy).toHaveBeenCalledWith(data, client);
	});
});

