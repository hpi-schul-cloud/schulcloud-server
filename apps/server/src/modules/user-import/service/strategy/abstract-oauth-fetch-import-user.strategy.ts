import { ImportUser } from '@shared/domain/entity';

export abstract class AbstractOauthFetchImportUserStrategy<T, U> {
	public abstract getData(params: U): Promise<T>;

	public abstract mapDataToUserImportEntity(response: T): Promise<ImportUser>;
}
