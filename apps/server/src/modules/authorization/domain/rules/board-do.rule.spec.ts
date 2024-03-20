import { Test, TestingModule } from '@nestjs/testing';
import {
	columnBoardFactory,
	drawingElementFactory,
	fileElementFactory,
	roleFactory,
	setupEntities,
	submissionItemFactory,
	userFactory,
} from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardDoAuthorizable, BoardRoles } from '@shared/domain/domainobject';
import { Permission } from '@shared/domain/interface';
import { Action } from '../type';
import { AuthorizationHelper } from '../service/authorization.helper';
import { BoardDoRule } from './board-do.rule';

describe(BoardDoRule.name, () => {
	let service: BoardDoRule;
	let authorizationHelper: AuthorizationHelper;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [BoardDoRule, AuthorizationHelper],
		}).compile();

		service = await module.get(BoardDoRule);
		authorizationHelper = await module.get(AuthorizationHelper);
	});

	describe('isApplicable', () => {
		describe('when entity is applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const anyBoardDo = fileElementFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardDoAuthorizable = new BoardDoAuthorizable({
					users: [],
					id: new ObjectId().toHexString(),
					boardDo: anyBoardDo,
					rootDo: columnBoard,
				});
				return { user, boardDoAuthorizable };
			};

			it('should return true', () => {
				const { user, boardDoAuthorizable } = setup();

				const result = service.isApplicable(user, boardDoAuthorizable);

				expect(result).toStrictEqual(true);
			});
		});

		describe('when entity is not applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				return { user };
			};

			it('should return false', () => {
				const { user } = setup();
				// @ts-expect-error test wrong entity
				const result = service.isApplicable(user, user);

				expect(result).toStrictEqual(false);
			});
		});
	});

	describe('hasPermission', () => {
		describe('when user has permission', () => {
			const setup = () => {
				const permissionA = 'a' as Permission;
				const permissionB = 'b' as Permission;
				const role = roleFactory.build({ permissions: [permissionA, permissionB] });
				const user = userFactory.buildWithId({ roles: [role] });
				const anyBoardDo = fileElementFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardDoAuthorizable = new BoardDoAuthorizable({
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
					id: new ObjectId().toHexString(),
					boardDo: anyBoardDo,
					rootDo: columnBoard,
				});

				return { user, boardDoAuthorizable };
			};

			it('should call hasAllPermissions on AuthorizationHelper', () => {
				const { user, boardDoAuthorizable } = setup();

				const spy = jest.spyOn(authorizationHelper, 'hasAllPermissions');
				service.hasPermission(user, boardDoAuthorizable, { action: Action.read, requiredPermissions: [] });

				expect(spy).toBeCalledWith(user, []);
			});

			it('should return "true"', () => {
				const { user, boardDoAuthorizable } = setup();

				const res = service.hasPermission(user, boardDoAuthorizable, { action: Action.read, requiredPermissions: [] });

				expect(res).toBe(true);
			});
		});

		describe('when user does not have permission', () => {
			const setup = () => {
				const permissionA = 'a' as Permission;
				const user = userFactory.buildWithId();
				const anyBoardDo = fileElementFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardDoAuthorizable = new BoardDoAuthorizable({
					users: [{ userId: user.id, roles: [BoardRoles.READER] }],
					id: new ObjectId().toHexString(),
					boardDo: anyBoardDo,
					rootDo: columnBoard,
				});

				return { user, permissionA, boardDoAuthorizable };
			};

			it('should return "false"', () => {
				const { user, permissionA, boardDoAuthorizable } = setup();

				const res = service.hasPermission(user, boardDoAuthorizable, {
					action: Action.write,
					requiredPermissions: [permissionA],
				});

				expect(res).toBe(false);
			});
		});

		describe('when user is not part of the BoardDoAuthorizable', () => {
			const setup = () => {
				const role = roleFactory.build();
				const user = userFactory.buildWithId({ roles: [role] });
				const userWithoutPermision = userFactory.buildWithId({ roles: [role] });
				const anyBoardDo = fileElementFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardDoAuthorizable = new BoardDoAuthorizable({
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
					id: new ObjectId().toHexString(),
					boardDo: anyBoardDo,
					rootDo: columnBoard,
				});

				return { userWithoutPermision, boardDoAuthorizable };
			};

			it('should return "false"', () => {
				const { userWithoutPermision, boardDoAuthorizable } = setup();

				const res = service.hasPermission(userWithoutPermision, boardDoAuthorizable, {
					action: Action.read,
					requiredPermissions: [],
				});

				expect(res).toBe(false);
			});
		});

		describe('when user does not have the desired role', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const anyBoardDo = fileElementFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardDoAuthorizable = new BoardDoAuthorizable({
					users: [{ userId: user.id, roles: [] }],
					id: new ObjectId().toHexString(),
					boardDo: anyBoardDo,
					rootDo: columnBoard,
				});

				return { user, boardDoAuthorizable };
			};

			it('should return "false"', () => {
				const { user, boardDoAuthorizable } = setup();

				const res = service.hasPermission(user, boardDoAuthorizable, {
					action: Action.read,
					requiredPermissions: [],
				});

				expect(res).toBe(false);
			});
		});

		describe('when boardDoAuthorizable.rootDo is not visible', () => {
			describe('when user is Editor', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const anyBoardDo = fileElementFactory.build();
					const columnBoard = columnBoardFactory.build({ isVisible: false });
					const boardDoAuthorizable = new BoardDoAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
						id: new ObjectId().toHexString(),
						boardDo: anyBoardDo,
						rootDo: columnBoard,
					});

					return { user, boardDoAuthorizable };
				};
				it('it should return true if trying to "write" ', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
				it('it should return true if trying to "read" ', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
			});
			describe('when user is Reader', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const anyBoardDo = fileElementFactory.build();
					const columnBoard = columnBoardFactory.build({ isVisible: false });
					const boardDoAuthorizable = new BoardDoAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: new ObjectId().toHexString(),
						boardDo: anyBoardDo,
						rootDo: columnBoard,
					});

					return { user, boardDoAuthorizable };
				};
				it('it should return false if trying to "write" ', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
				it('it should return false if trying to "read" ', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
			});
		});

		describe('when boardDoAuthorizable.boardDo is a submissionItem', () => {
			describe('when user is Editor', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const submissionItem = submissionItemFactory.build();
					const columnBoard = columnBoardFactory.build();
					const boardDoAuthorizable = new BoardDoAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
						id: new ObjectId().toHexString(),
						boardDo: submissionItem,
						rootDo: columnBoard,
					});

					return { user, boardDoAuthorizable };
				};
				it('it should return false if trying to "write" ', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
				it('it should return true if trying to "read"', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
			});
			describe('when user is Reader and creator of the submissionItem', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const submissionItem = submissionItemFactory.build({ userId: user.id });
					const columnBoard = columnBoardFactory.build();
					const boardDoAuthorizable = new BoardDoAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: new ObjectId().toHexString(),
						boardDo: submissionItem,
						rootDo: columnBoard,
					});

					return { user, boardDoAuthorizable };
				};
				it('it should return "true" if trying to "write" ', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
				it('it should return "true" if trying to "read"', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
			});
			describe('when user is Reader and not creator of the submissionItem', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const submissionItem = submissionItemFactory.build({ userId: new ObjectId().toHexString() });
					const columnBoard = columnBoardFactory.build();
					const boardDoAuthorizable = new BoardDoAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: new ObjectId().toHexString(),
						boardDo: submissionItem,
						rootDo: columnBoard,
					});

					return { user, boardDoAuthorizable };
				};
				it('it should return "false" if trying to "write" ', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
				it('it should return "false" if trying to "read"', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
			});
		});

		describe('when boardDoAuthorizable.parentDo is a submissionItem', () => {
			describe('when user is Editor', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const submissionItem = submissionItemFactory.build();
					const fileElement = fileElementFactory.build();
					const columnBoard = columnBoardFactory.build();
					const boardDoAuthorizable = new BoardDoAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
						id: new ObjectId().toHexString(),
						boardDo: fileElement,
						parentDo: submissionItem,
						rootDo: columnBoard,
					});

					return { user, boardDoAuthorizable };
				};
				it('it should return false if trying to "write" ', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
				it('it should return true if trying to "read"', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
			});
			describe('when user is Reader and creator of the submissionItem', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const submissionItem = submissionItemFactory.build({ userId: user.id });
					const fileElement = fileElementFactory.build();
					const columnBoard = columnBoardFactory.build();
					const boardDoAuthorizable = new BoardDoAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: new ObjectId().toHexString(),
						boardDo: fileElement,
						parentDo: submissionItem,
						rootDo: columnBoard,
					});

					return { user, boardDoAuthorizable };
				};
				it('it should return "true" if trying to "write" ', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
				it('it should return "true" if trying to "read"', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
			});
			describe('when user is Reader and not creator of the submissionItem', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const anyBoardDo = fileElementFactory.build();
					const submissionItem = submissionItemFactory.build({ userId: new ObjectId().toHexString() });
					const columnBoard = columnBoardFactory.build();
					const boardDoAuthorizable = new BoardDoAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: new ObjectId().toHexString(),
						boardDo: anyBoardDo,
						parentDo: submissionItem,
						rootDo: columnBoard,
					});

					return { user, boardDoAuthorizable };
				};
				it('it should return "false" if trying to "write" ', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
				it('it should return "false" if trying to "read"', () => {
					const { user, boardDoAuthorizable } = setup();

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
			});
			describe('when bordDo is wrong type', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const notAllowedChildElement = drawingElementFactory.build();
					const submissionItem = submissionItemFactory.build();

					return { user, notAllowedChildElement, submissionItem };
				};
				it('when boardDo is undefined, it should return false', () => {
					const { user, submissionItem } = setup();
					const anyBoardDo = fileElementFactory.build();
					const columnBoard = columnBoardFactory.build();
					const boardDoAuthorizable = new BoardDoAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
						id: new ObjectId().toHexString(),
						boardDo: anyBoardDo,
						parentDo: submissionItem,
						rootDo: columnBoard,
					});

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});

				it('when boardDo is not allowed type, it should return false', () => {
					const { user, submissionItem, notAllowedChildElement } = setup();
					const columnBoard = columnBoardFactory.build();
					const boardDoAuthorizable = new BoardDoAuthorizable({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
						id: new ObjectId().toHexString(),
						parentDo: submissionItem,
						boardDo: notAllowedChildElement,
						rootDo: columnBoard,
					});

					const res = service.hasPermission(user, boardDoAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
			});
		});

		describe('when boardDoAuthorizable.board is a drawingElement', () => {
			describe('when required permissions do not include FILESTORAGE_CREATE or FILESTORAGE_VIEW', () => {
				describe('when user is Editor', () => {
					const setup = () => {
						const user = userFactory.buildWithId();
						const drawingElement = drawingElementFactory.build();
						const columnBoard = columnBoardFactory.build();
						const boardDoAuthorizable = new BoardDoAuthorizable({
							users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
							id: new ObjectId().toHexString(),
							boardDo: drawingElement,
							rootDo: columnBoard,
						});

						return { user, boardDoAuthorizable };
					};
					it('should return true if trying to "read"', () => {
						const { user, boardDoAuthorizable } = setup();

						const res = service.hasPermission(user, boardDoAuthorizable, {
							action: Action.read,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
					it('should return true if trying to "write" ', () => {
						const { user, boardDoAuthorizable } = setup();

						const res = service.hasPermission(user, boardDoAuthorizable, {
							action: Action.write,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
				});
				describe('when user is Reader', () => {
					const setup = () => {
						const user = userFactory.buildWithId();
						const drawingElement = drawingElementFactory.build();
						const columnBoard = columnBoardFactory.build();
						const boardDoAuthorizable = new BoardDoAuthorizable({
							users: [{ userId: user.id, roles: [BoardRoles.READER] }],
							id: new ObjectId().toHexString(),
							boardDo: drawingElement,
							rootDo: columnBoard,
						});

						return { user, boardDoAuthorizable };
					};
					it('should return true if trying to "read"', () => {
						const { user, boardDoAuthorizable } = setup();

						const res = service.hasPermission(user, boardDoAuthorizable, {
							action: Action.read,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
					it('should return false if trying to "write" ', () => {
						const { user, boardDoAuthorizable } = setup();

						const res = service.hasPermission(user, boardDoAuthorizable, {
							action: Action.write,
							requiredPermissions: [],
						});

						expect(res).toBe(false);
					});
				});
			});
			describe('when required permissions include FILESTORAGE_CREATE or FILESTORAGE_VIEW', () => {
				describe('when user is Editor', () => {
					const setup = () => {
						const user = userFactory.asTeacher().buildWithId();
						const drawingElement = drawingElementFactory.build();
						const columnBoard = columnBoardFactory.build();
						const boardDoAuthorizable = new BoardDoAuthorizable({
							users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
							id: new ObjectId().toHexString(),
							boardDo: drawingElement,
							rootDo: columnBoard,
						});

						return { user, boardDoAuthorizable };
					};
					it('should return true if trying to "read"', () => {
						const { user, boardDoAuthorizable } = setup();

						const res = service.hasPermission(user, boardDoAuthorizable, {
							action: Action.read,
							requiredPermissions: [Permission.FILESTORAGE_VIEW],
						});

						expect(res).toBe(true);
					});
					it('should return true if trying to "write" ', () => {
						const { user, boardDoAuthorizable } = setup();

						const res = service.hasPermission(user, boardDoAuthorizable, {
							action: Action.write,
							requiredPermissions: [Permission.FILESTORAGE_CREATE],
						});

						expect(res).toBe(true);
					});
				});
				describe('when user is Reader', () => {
					const setup = () => {
						const user = userFactory.asStudent().buildWithId();
						const drawingElement = drawingElementFactory.build();
						const columnBoard = columnBoardFactory.build();
						const boardDoAuthorizable = new BoardDoAuthorizable({
							users: [{ userId: user.id, roles: [BoardRoles.READER] }],
							id: new ObjectId().toHexString(),
							boardDo: drawingElement,
							rootDo: columnBoard,
						});

						return { user, boardDoAuthorizable };
					};
					it('should return true if trying to "read"', () => {
						const { user, boardDoAuthorizable } = setup();

						const res = service.hasPermission(user, boardDoAuthorizable, {
							action: Action.read,
							requiredPermissions: [Permission.FILESTORAGE_VIEW],
						});

						expect(res).toBe(true);
					});
					it('should ALSO return true if trying to "write" ', () => {
						const { user, boardDoAuthorizable } = setup();

						const res = service.hasPermission(user, boardDoAuthorizable, {
							action: Action.write,
							requiredPermissions: [Permission.FILESTORAGE_CREATE],
						});

						expect(res).toBe(true);
					});
				});
			});
		});
	});
});
