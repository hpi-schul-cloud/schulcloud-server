[ ] BoardNodeRepo additional methods
  [+] `findById` - depth
  [+] `findByIds`
  [+] `getTitlesByIds`
      - `ColumnBoardCopyService.deriveColumnBoardTitle` => refactored to `ColumnBoardTitleService.deriveColumnBoardTitle`
      - `ColumnBoardService.getBoardObjectTitlesById` => not used  
  [+] `countBoardUsageForExternalTools`
      - moved to `service/board-common-tool.service.ts`
  [ ] refactor unit tests from 
    `board/repo/board-node.repo.spec.ts` and `board/repo/board-do.repo.spec.ts` 
    to `board/poc/repo/board-node.repo.spec.ts`
[ ] BoardNode (composite domain object)
  [+] `canHaveChild()`, see `BoardComposite.isAllowedAsChild()`
  [+] `getChildrenOfType`
      - was only used by media board
      - moved to `MediaBoardService.findMediaElements`
[+] Create
  [+] `BoardNodeFactory`
  [+] `BoardNodeService.addRoot`, `BoardNodeService.addToParent`
  [+] `MediaBoardNodeFactory`
  [+] `MediaBoardService.addToBoard`, `MediaBoardService.addToMediaLine`
[ ] Update 
  [+] `BoardNodeService.update<trait>` methods
  [+] `ContentElementUpdateService.updateContent`
[ ] Move
  [+] `BoardNodeService.move`
[ ] Delete
  [+] recursive delete
  [+] delete hooks
[ ] Copy
  [+] board node copy
  [+] column board copy
[ ] ColumnBoardService
  [ ] `findByDescendant`
      - used by tools `AutoContextNameStrategy` TODO refactor call
      - moved to `BoardCommonToolService.findByDescendant`
  [+] `deleteByCourseId`
      - used by `/src/services/user-group/hooks/courses.js#L190`
  [+] `deleteByExternalReference`
      - was used by `UserDeletedEventHandler` => refactored to `findByExternalReference`

17.05.2024 14:28 ✖ Found 154 circular dependencies!