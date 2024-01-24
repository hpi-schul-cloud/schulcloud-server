enum DatabaseAction {
	UPDATE = 'update'
}

enum Version {
	V1_SV = 'v1_sv',
	V1 = 'v1'
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
			throw new Error('Invalid clock value is passed to KeyFactory')
		}
	}

	static createForUpdate(docName: string, clock?: number): UniqueKey {
		KeyFactory.checkValidClock(clock);

		const uniqueKey = {
			docName,
			version: Version.V1,
			action: DatabaseAction.UPDATE,
			// TODO: Do it work when key is exists, but value is undefined? Same for action in createForStateVector 
			clock
		}

		return uniqueKey;
	}

	// TODO: Copy paste from source code, but i think naming must be changed.
	static createForStateVector(docName: string): UniqueKey {
		const uniqueKey = {
			docName,
			version: Version.V1_SV,
		}

		return uniqueKey;
	}
}
