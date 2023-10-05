import { Doc } from 'yjs';
import WebSocket from 'ws';
import { Awareness, encodeAwarenessUpdate } from 'y-protocols/awareness';
import { encoding } from 'lib0';
import { Configuration } from '@hpi-schul-cloud/commons';
import { WSMessageType } from '@src/modules/tldraw/types/connection-enum';
import { TldrawWsService } from '@src/modules/tldraw/service';

// disable gc when using snapshots!
const gcEnabled: boolean = Configuration.get('TLDRAW__GC_ENABLED') as boolean;

export class WsSharedDocDo extends Doc {
	name: string;

	public conns: Map<WebSocket, Set<number>>;

	public awareness: Awareness;

	/**
	 * @param {string} name
	 * @param {TldrawWsService} tldrawService
	 */
	constructor(name: string, private tldrawService: TldrawWsService) {
		super({ gc: gcEnabled });
		this.name = name;
		this.conns = new Map();
		this.awareness = new Awareness(this);
		this.awareness.setLocalState(null);

		this.awareness.on('update', this.awarenessChangeHandler);
		this.on('update', (update: Uint8Array, origin, doc: WsSharedDocDo) => {
			this.tldrawService.updateHandler(update, origin, doc);
		});
	}

	/**
	 * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes
	 * @param {WebSocket | null} conn Origin is the connection that made the change
	 */
	public awarenessChangeHandler = (
		{ added, updated, removed }: { added: Array<number>; updated: Array<number>; removed: Array<number> },
		conn: WebSocket | null
	) => {
		const changedClients = added.concat(updated, removed);
		if (conn !== null) {
			const connControlledIDs = this.conns.get(conn) as Set<number>;
			if (connControlledIDs !== undefined) {
				added.forEach((clientID) => {
					connControlledIDs.add(clientID);
				});
				removed.forEach((clientID) => {
					connControlledIDs.delete(clientID);
				});
			}
		}
		// broadcast awareness update
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, WSMessageType.AWARENESS);
		encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(this.awareness, changedClients));
		const buff = encoding.toUint8Array(encoder);
		this.conns.forEach((_, c) => {
			this.tldrawService.send(this, c, buff);
		});
	};
}
