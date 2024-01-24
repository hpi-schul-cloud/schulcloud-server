enum DatabaseAction {
    UPDATE = 'update'
}

enum Version {
    V1_SV = 'v1_sv',
    V1 = 'v1'
}

interface UniqueDatabaseKey {
    version: Version;
    action?: DatabaseAction;
    docName: string;
    clock?: number;
}

export class DatabaseKeyFactory {
    static createForUpdate(docName: string, clock?: number): UniqueDatabaseKey {
        const uniqueKey = {
            docName,
            version: Version.V1,
            action: DatabaseAction.UPDATE,
            // TODO: Do it work when key is exists, but value is undefined?
            clock
        }

        return uniqueKey;
    }

    // TODO: Copy paste from source code, but i think naming must be changed.
    static createForStateVector(docName: string): UniqueDatabaseKey {
        const uniqueKey = {
            docName,
            version: Version.V1_SV,
        }

        return uniqueKey;
    }
}