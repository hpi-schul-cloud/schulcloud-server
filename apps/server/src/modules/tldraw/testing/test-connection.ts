import WebSocket from 'ws';

export class TestConnection {
	public static getWsUrl = (gatewayPort: number): string => {
		const wsUrl = `ws://localhost:${gatewayPort}`;
		return wsUrl;
	};

	public static setupWs = async (
		wsUrl: string,
		docName?: string,
		headers?: Record<string, string>
	): Promise<WebSocket> => {
		let ws: WebSocket;
		if (docName) {
			ws = new WebSocket(`${wsUrl}/${docName}`, { headers });
		} else {
			ws = new WebSocket(`${wsUrl}`, { headers });
		}
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		return ws;
	};
}
