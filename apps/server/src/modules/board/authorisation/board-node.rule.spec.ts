import { ObjectId } from '@mikro-orm/mongodb';
import { Action, AuthorizationInjectionService } from '@modules/authorization';
import { BoardRoles } from '@modules/board';
import { roleFactory } from '@modules/role/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import {
	boardNodeAuthorizableFactory,
	columnBoardFactory,
	drawingElementFactory,
	fileElementFactory,
	submissionItemFactory,
	videoConferenceElementFactory,
} from '../testing';
import { BoardNodeRule } from './board-node.rule';
import { BoardSettings } from '../domain';

describe(BoardNodeRule.name, () => {
	let service: BoardNodeRule;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		await setupEntities([User]);

		const module: TestingModule = await Test.createTestingModule({
			providers: [BoardNodeRule, AuthorizationInjectionService],
		}).compile();

		service = await module.get(BoardNodeRule);
		injectionService = await module.get(AuthorizationInjectionService);
	});

	describe('injection', () => {
		it('should inject itself into authorisation module', () => {
			expect(injectionService.getAuthorizationRules()).toContain(service);
		});
	});

	describe('isApplicable', () => {
		describe('when entity is applicable', () => {
			const setup = () => {
				const user = userFactory.build();
				const anyBoardNode = fileElementFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [],
					id: new ObjectId().toHexString(),
					boardNode: anyBoardNode,
					rootNode: columnBoard,
					boardSettings: {},
				});
				return { user, boardNodeAuthorizable };
			};

			it('should return true', () => {
				const { boardNodeAuthorizable, user } = setup();

				const result = service.isApplicable(user, boardNodeAuthorizable);

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
				const anyBoardNode = fileElementFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
					id: new ObjectId().toHexString(),
					boardNode: anyBoardNode,
					rootNode: columnBoard,
					boardSettings: {},
				});

				return { user, boardNodeAuthorizable };
			};

			it('should return "true"', () => {
				const { user, boardNodeAuthorizable } = setup();

				const res = service.hasPermission(user, boardNodeAuthorizable, {
					action: Action.read,
					requiredPermissions: [],
				});

				expect(res).toBe(true);
			});
		});

		describe('when user has a boardPermission permission', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const anyBoardNode = fileElementFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }], // Editor has BOARD_VIEW permission
					id: new ObjectId().toHexString(),
					boardNode: anyBoardNode,
					rootNode: columnBoard,
					boardSettings: {},
				});

				return { user, boardNodeAuthorizable };
			};

			it('should return "true"', () => {
				const { user, boardNodeAuthorizable } = setup();

				const res = service.hasPermission(user, boardNodeAuthorizable, {
					action: Action.read,
					requiredPermissions: [Permission.BOARD_VIEW],
				});

				expect(res).toBe(true);
			});
		});

		describe('when user does not have permission', () => {
			const setup = () => {
				const permissionA = 'a' as Permission;
				const user = userFactory.buildWithId();
				const anyBoardNode = fileElementFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [{ userId: user.id, roles: [BoardRoles.READER] }],
					id: new ObjectId().toHexString(),
					boardNode: anyBoardNode,
					rootNode: columnBoard,
					boardSettings: {},
				});

				return { user, permissionA, boardNodeAuthorizable };
			};

			it('should return "false"', () => {
				const { user, permissionA, boardNodeAuthorizable } = setup();

				const res = service.hasPermission(user, boardNodeAuthorizable, {
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
				const anyBoardNode = fileElementFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
					id: new ObjectId().toHexString(),
					boardNode: anyBoardNode,
					rootNode: columnBoard,
					boardSettings: {},
				});

				return { userWithoutPermision, boardNodeAuthorizable };
			};

			it('should return "false"', () => {
				const { userWithoutPermision, boardNodeAuthorizable } = setup();

				const res = service.hasPermission(userWithoutPermision, boardNodeAuthorizable, {
					action: Action.read,
					requiredPermissions: [],
				});

				expect(res).toBe(false);
			});
		});

		describe('when user does not have the desired role', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const anyBoardNode = fileElementFactory.build();
				const columnBoard = columnBoardFactory.build();
				const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
					users: [{ userId: user.id, roles: [] }],
					id: new ObjectId().toHexString(),
					boardNode: anyBoardNode,
					rootNode: columnBoard,
					boardSettings: {},
				});

				return { user, boardNodeAuthorizable };
			};

			it('should return "false"', () => {
				const { user, boardNodeAuthorizable } = setup();

				const res = service.hasPermission(user, boardNodeAuthorizable, {
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
					const anyBoardNode = fileElementFactory.build();
					const columnBoard = columnBoardFactory.build({ isVisible: false });
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
						id: new ObjectId().toHexString(),
						boardNode: anyBoardNode,
						rootNode: columnBoard,
						boardSettings: {},
					});

					return { user, boardNodeAuthorizable };
				};
				it('it should return true if trying to "write" ', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
				it('it should return true if trying to "read" ', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
						action: Action.read,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
			});
			describe('when user is Reader', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
					const anyBoardNode = fileElementFactory.build();
					const columnBoard = columnBoardFactory.build({ isVisible: false });
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: new ObjectId().toHexString(),
						boardNode: anyBoardNode,
						rootNode: columnBoard,
						boardSettings: {},
					});

					return { user, boardNodeAuthorizable };
				};
				it('it should return false if trying to "write" ', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
				it('it should return false if trying to "read" ', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
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
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
						id: new ObjectId().toHexString(),
						boardNode: submissionItem,
						rootNode: columnBoard,
						boardSettings: {},
					});

					return { user, boardNodeAuthorizable };
				};
				it('it should return false if trying to "write" ', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
				it('it should return true if trying to "read"', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
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
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: new ObjectId().toHexString(),
						boardNode: submissionItem,
						rootNode: columnBoard,
						boardSettings: {},
					});

					return { user, boardNodeAuthorizable };
				};
				it('it should return "true" if trying to "write" ', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
				it('it should return "true" if trying to "read"', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
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
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: new ObjectId().toHexString(),
						boardNode: submissionItem,
						rootNode: columnBoard,
						boardSettings: {},
					});

					return { user, boardNodeAuthorizable };
				};
				it('it should return "false" if trying to "write" ', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
				it('it should return "false" if trying to "read"', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
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
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
						id: new ObjectId().toHexString(),
						boardNode: fileElement,
						parentNode: submissionItem,
						rootNode: columnBoard,
						boardSettings: {},
					});

					return { user, boardNodeAuthorizable };
				};
				it('it should return false if trying to "write" ', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
				it('it should return true if trying to "read"', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
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
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: new ObjectId().toHexString(),
						boardNode: fileElement,
						parentNode: submissionItem,
						rootNode: columnBoard,
						boardSettings: {},
					});

					return { user, boardNodeAuthorizable };
				};
				it('it should return "true" if trying to "write" ', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(true);
				});
				it('it should return "true" if trying to "read"', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
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
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: new ObjectId().toHexString(),
						boardNode: anyBoardDo,
						parentNode: submissionItem,
						rootNode: columnBoard,
						boardSettings: {},
					});

					return { user, boardNodeAuthorizable };
				};
				it('it should return "false" if trying to "write" ', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
				it('it should return "false" if trying to "read"', () => {
					const { user, boardNodeAuthorizable } = setup();

					const res = service.hasPermission(user, boardNodeAuthorizable, {
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
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
						id: new ObjectId().toHexString(),
						boardNode: anyBoardDo,
						parentNode: submissionItem,
						rootNode: columnBoard,
						boardSettings: {},
					});

					const res = service.hasPermission(user, boardNodeAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});

				it('when boardDo is not allowed type, it should return false', () => {
					const { user, submissionItem, notAllowedChildElement } = setup();
					const columnBoard = columnBoardFactory.build();
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
						id: new ObjectId().toHexString(),
						parentNode: submissionItem,
						boardNode: notAllowedChildElement,
						rootNode: columnBoard,
						boardSettings: {},
					});

					const res = service.hasPermission(user, boardNodeAuthorizable, {
						action: Action.write,
						requiredPermissions: [],
					});

					expect(res).toBe(false);
				});
			});
		});

		describe('when boardDoAuthorizable.boardDo is a drawingElement', () => {
			describe('when required permissions do not include FILESTORAGE_CREATE or FILESTORAGE_VIEW or FILESTORAGE_REMOVE', () => {
				describe('when user is Editor', () => {
					const setup = () => {
						const user = userFactory.buildWithId();
						const drawingElement = drawingElementFactory.build();
						const columnBoard = columnBoardFactory.build();
						const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
							users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
							id: new ObjectId().toHexString(),
							boardNode: drawingElement,
							rootNode: columnBoard,
							boardSettings: {},
						});

						return { user, boardNodeAuthorizable };
					};
					it('should return true if trying to "read"', () => {
						const { user, boardNodeAuthorizable } = setup();

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.read,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
					it('should return true if trying to "write" ', () => {
						const { user, boardNodeAuthorizable } = setup();

						const res = service.hasPermission(user, boardNodeAuthorizable, {
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
						const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
							users: [{ userId: user.id, roles: [BoardRoles.READER] }],
							id: new ObjectId().toHexString(),
							boardNode: drawingElement,
							rootNode: columnBoard,
							boardSettings: {},
						});

						return { user, boardNodeAuthorizable };
					};
					it('should return true if trying to "read"', () => {
						const { user, boardNodeAuthorizable } = setup();

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.read,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
					it('should return false if trying to "write" ', () => {
						const { user, boardNodeAuthorizable } = setup();

						const res = service.hasPermission(user, boardNodeAuthorizable, {
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
						const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
							users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
							id: new ObjectId().toHexString(),
							boardNode: drawingElement,
							rootNode: columnBoard,
							boardSettings: {},
						});

						return { user, boardNodeAuthorizable };
					};
					it('should return true if trying to "read"', () => {
						const { user, boardNodeAuthorizable } = setup();

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.read,
							requiredPermissions: [Permission.FILESTORAGE_VIEW],
						});

						expect(res).toBe(true);
					});
					it('should return true if trying to "write" ', () => {
						const { user, boardNodeAuthorizable } = setup();

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.write,
							requiredPermissions: [Permission.FILESTORAGE_CREATE],
						});

						expect(res).toBe(true);
					});
					it('should return true if trying to "write" ', () => {
						const { user, boardNodeAuthorizable } = setup();

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.write,
							requiredPermissions: [Permission.FILESTORAGE_REMOVE],
						});

						expect(res).toBe(true);
					});
				});
				describe('when user is Reader', () => {
					const setup = () => {
						const user = userFactory.asStudent().buildWithId();
						const drawingElement = drawingElementFactory.build();
						const columnBoard = columnBoardFactory.build();
						const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
							users: [{ userId: user.id, roles: [BoardRoles.READER] }],
							id: new ObjectId().toHexString(),
							boardNode: drawingElement,
							rootNode: columnBoard,
							boardSettings: {},
						});

						return { user, boardNodeAuthorizable };
					};
					it('should return true if trying to "read"', () => {
						const { user, boardNodeAuthorizable } = setup();

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.read,
							requiredPermissions: [Permission.FILESTORAGE_VIEW],
						});

						expect(res).toBe(true);
					});
					it('should ALSO return true if trying to "write" ', () => {
						const { user, boardNodeAuthorizable } = setup();

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.write,
							requiredPermissions: [Permission.FILESTORAGE_CREATE],
						});

						expect(res).toBe(true);
					});
				});
			});
		});

		describe('when boardDoAuthorizable.boardDo is a videoConferenceElement', () => {
			describe('when user is Admin', () => {
				const setup = (boardSettings: BoardSettings) => {
					const user = userFactory.asTeacher().buildWithId();
					const videoConferenceElement = videoConferenceElementFactory.build();
					const columnBoard = columnBoardFactory.build();
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR, BoardRoles.ADMIN] }],
						id: new ObjectId().toHexString(),
						boardNode: videoConferenceElement,
						rootNode: columnBoard,
						boardSettings,
					});

					return { user, boardNodeAuthorizable };
				};
				describe('when board settings allow editors to create video conferences', () => {
					it('should return true if trying to "read"', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: true });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.read,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
					it('should return true if trying to "write" ', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: true });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.write,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
				});

				describe('when board settings prohibit editors to create video conferences', () => {
					it('should return true if trying to "read"', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: false });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.read,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
					it('should return true if trying to "write" ', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: false });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.write,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
				});
			});
			describe('when user is Editor', () => {
				const setup = (boardSettings: BoardSettings) => {
					const user = userFactory.asTeacher().buildWithId();
					const videoConferenceElement = videoConferenceElementFactory.build();
					const columnBoard = columnBoardFactory.build();
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.EDITOR] }],
						id: new ObjectId().toHexString(),
						boardNode: videoConferenceElement,
						rootNode: columnBoard,
						boardSettings,
					});

					return { user, boardNodeAuthorizable };
				};
				describe('when board settings allow editors to create video conferences', () => {
					it('should return true if trying to "read"', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: true });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.read,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
					it('should return true if trying to "write" ', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: true });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.write,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
				});

				describe('when board settings prohibit editors to create video conferences', () => {
					it('should return true if trying to "read"', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: false });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.read,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
					it('should return false if trying to "write" ', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: false });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.write,
							requiredPermissions: [],
						});

						expect(res).toBe(false);
					});
				});
			});
			describe('when user is Reader', () => {
				const setup = (boardSettings: BoardSettings) => {
					const user = userFactory.asTeacher().buildWithId();
					const videoConferenceElement = videoConferenceElementFactory.build();
					const columnBoard = columnBoardFactory.build();
					const boardNodeAuthorizable = boardNodeAuthorizableFactory.build({
						users: [{ userId: user.id, roles: [BoardRoles.READER] }],
						id: new ObjectId().toHexString(),
						boardNode: videoConferenceElement,
						rootNode: columnBoard,
						boardSettings,
					});

					return { user, boardNodeAuthorizable };
				};
				describe('when board settings allow editors to create video conferences', () => {
					it('should return true if trying to "read"', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: true });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.read,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
					it('should return false if trying to "write" ', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: true });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.write,
							requiredPermissions: [],
						});

						expect(res).toBe(false);
					});
				});

				describe('when board settings prohibit editors to create video conferences', () => {
					it('should return true if trying to "read"', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: false });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.read,
							requiredPermissions: [],
						});

						expect(res).toBe(true);
					});
					it('should return false if trying to "write" ', () => {
						const { user, boardNodeAuthorizable } = setup({ canRoomEditorManageVideoconference: false });

						const res = service.hasPermission(user, boardNodeAuthorizable, {
							action: Action.write,
							requiredPermissions: [],
						});

						expect(res).toBe(false);
					});
				});
			});
		});
	});
});
