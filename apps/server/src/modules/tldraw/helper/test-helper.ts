import WebSocket from 'ws';

export class TestHelper {
	public static getWsUrl = (gatewayPort: number): string => {
		const wsUrl = `ws://localhost:${gatewayPort}`;
		return wsUrl;
	};

	public static setupWs = async (wsUrl: string, docName?: string): Promise<WebSocket> => {
		let ws: WebSocket;
		if (docName) {
			ws = new WebSocket(`${wsUrl}/${docName}`);
		} else {
			ws = new WebSocket(`${wsUrl}`);
		}
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		return ws;
	};
}
