enum DatabaseAction {
	UPDATE = 'update',
}

export enum Version {
	V1_SV = 'v1_sv',
	V1 = 'v1',
}

interface UniqueKey {
	version: Version;
	action?: DatabaseAction;
	docName: string;
	clock?: number;
}

export class KeyFactory {
	static checkValidClock(clock?: number): void {
		if (clock && clock < -1) {
			throw new Error('Invalid clock value is passed to KeyFactory');
		}
	}

	static createForUpdate(docName: string, clock?: number): UniqueKey {
		KeyFactory.checkValidClock(clock);
		let uniqueKey: UniqueKey;

		if (clock !== undefined) {
			uniqueKey = {
				docName,
				version: Version.V1,
				action: DatabaseAction.UPDATE,
				clock,
			};
		} else {
			uniqueKey = {
				docName,
				version: Version.V1,
				action: DatabaseAction.UPDATE,
			};
		}

		return uniqueKey;
	}

	static createForInsert(docName: string): UniqueKey {
		const uniqueKey = {
			docName,
			version: Version.V1_SV,
		};

		return uniqueKey;
	}
}
