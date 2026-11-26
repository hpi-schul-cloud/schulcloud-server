import { type LookupFunction } from 'node:net';
import { type BoardImportCheckedAddress } from './board-import-link-check.service';

// A connection that uses this lookup goes to the checked address, whatever the DNS answers at that time.
export const createPinnedLookup =
	({ address, family }: BoardImportCheckedAddress): LookupFunction =>
	(_hostname, options, callback) => {
		// Node asks for all addresses when it selects the address family automatically.
		if (options.all) {
			callback(null, [{ address, family }]);

			return;
		}
		callback(null, address, family);
	};
