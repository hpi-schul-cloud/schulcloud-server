import { setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { ShareTokenContextType, ShareTokenParentType } from '../domainobject/share-token.do';
import { ShareToken } from './share-token.entity';

describe('share-token entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	const setup = () => {
		const parentId = new ObjectId().toHexString();
		const contextId = new ObjectId().toHexString();
		const basicTokenProps = {
			token: 'abc',
			parentType: ShareTokenParentType.Course,
			parentId,
		};

		const tokenWithSchoolContextProps = {
			...basicTokenProps,
			contextType: ShareTokenContextType.School,
			contextId,
		};
		return { basicTokenProps, tokenWithSchoolContextProps, parentId, contextId };
	};

	describe('when creating a share-token', () => {
		describe('without context', () => {
			it('should create a ShareToken', () => {
				const { basicTokenProps } = setup();
				const shareToken = new ShareToken(basicTokenProps);
				expect(shareToken).toBeInstanceOf(ShareToken);
			});

			it('should return parentId as HexString', () => {
				const { basicTokenProps, parentId } = setup();
				const shareToken = new ShareToken(basicTokenProps);
				expect(shareToken.parentId).toEqual(parentId);
			});

			it('should return undefined as contextId', () => {
				const { basicTokenProps } = setup();
				const shareToken = new ShareToken(basicTokenProps);
				expect(shareToken.contextId).toBeUndefined();
			});
		});

		describe('with context', () => {
			it('should create a ShareToken with context', () => {
				const { tokenWithSchoolContextProps } = setup();
				const shareToken = new ShareToken(tokenWithSchoolContextProps);
				expect(shareToken).toBeInstanceOf(ShareToken);
			});

			it('should return contextId as HexString', () => {
				const { tokenWithSchoolContextProps, contextId } = setup();
				const shareToken = new ShareToken(tokenWithSchoolContextProps);
				expect(shareToken.contextId).toEqual(contextId);
			});
		});
	});
});
