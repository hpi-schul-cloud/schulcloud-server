import { applyUpdate, Doc } from 'yjs';
import WebSocket from 'ws';
import { applyAwarenessUpdate, Awareness, encodeAwarenessUpdate } from 'y-protocols/awareness';
import { encoding } from 'lib0';
import { WSMessageType } from '@modules/tldraw/types';
import { TldrawWsService } from '../service';

export class WsSharedDocDo extends Doc {
	public name: string;

	public conns: Map<WebSocket, Set<number>>;

	public awareness: Awareness;

	public awarenessChannel: string;

	/**
	 * @param {string} name
	 * @param {TldrawWsService} tldrawService
	 * @param {boolean} gcEnabled
	 */
	constructor(name: string, private tldrawService: TldrawWsService, gcEnabled = true) {
		super({ gc: gcEnabled });
		this.name = name;
		this.conns = new Map();
		this.awareness = new Awareness(this);
		this.awareness.setLocalState(null);
		this.awarenessChannel = `${name}-awareness`;

		this.awareness.on('update', this.awarenessChangeHandler);
		this.on('update', (update: Uint8Array, origin, doc: WsSharedDocDo) => {
			this.tldrawService.updateHandler(update, origin, doc);
		});

		// eslint-disable-next-line promise/always-return
		void this.tldrawService.sub.subscribe([this.name, this.awarenessChannel]).then(() => {
			console.log('Entered tldrawService.sub.subscribe');
			this.tldrawService.sub.on('messageBuffer', (channel: string, update: Uint8Array) => {
				const channelId = channel;
				console.log('Sub on messageBuffer, channelId: ', channelId);

				if (channelId === this.name) {
					console.log('Sub, when applyUpdate');
					applyUpdate(this, update, this.tldrawService.sub);
				} else if (channelId === this.awarenessChannel) {
					console.log('Sub, when applyAwarenessUpdate');
					applyAwarenessUpdate(this.awareness, update, this.tldrawService.sub);
				}
			});
		});
	}

	/**
	 * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes
	 * @param {WebSocket | null} wsConnection Origin is the connection that made the change
	 */
	public awarenessChangeHandler = (
		{ added, updated, removed }: { added: Array<number>; updated: Array<number>; removed: Array<number> },
		wsConnection: WebSocket | null
	): void => {
		const changedClients = this.manageClientsConnections({ added, updated, removed }, wsConnection);
		const buff = this.prepareAwarenessMessage(changedClients);
		this.sendAwarenessMessage(buff);
	};

	/**
	 * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes
	 * @param {WebSocket | null} wsConnection Origin is the connection that made the change
	 */
	private manageClientsConnections(
		{ added, updated, removed }: { added: Array<number>; updated: Array<number>; removed: Array<number> },
		wsConnection: WebSocket | null
	): number[] {
		const changedClients = added.concat(updated, removed);
		if (wsConnection !== null) {
			const connControlledIDs = this.conns.get(wsConnection);
			if (connControlledIDs !== undefined) {
				added.forEach((clientID) => {
					connControlledIDs.add(clientID);
				});
				removed.forEach((clientID) => {
					connControlledIDs.delete(clientID);
				});
			}
		}
		return changedClients;
	}

	/**
	 * @param changedClients array of changed clients
	 */
	private prepareAwarenessMessage(changedClients: number[]): Uint8Array {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, WSMessageType.AWARENESS);
		encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(this.awareness, changedClients));
		return encoding.toUint8Array(encoder);
	}

	/**
	 * @param {{ Uint8Array }} buff encoded message about changes
	 */
	private sendAwarenessMessage(buff: Uint8Array): void {
		this.conns.forEach((_, c) => {
			this.tldrawService.send(this, c, buff);
		});
	}
}
