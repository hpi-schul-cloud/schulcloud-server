[ ] BoardNodeRepo additional methods
  [ ] `findById` - depth
  [ ] `findByIds`
  [ ] `getTitlesByIds`
  [ ] `countBoardUsageForExternalTools`
  [ ] (`findParentOfId`)
[ ] refactor unit tests from 
    `board/repo/board-node.repo.spec.ts` and `board/repo/board-do.repo.spec.ts` 
    to `board/poc/repo/board-node.repo.spec.ts`
[ ] `BoardNode.isAllowedAsChild()`, see `BoardComposite.isAllowedAsChild()`

[ ] recursive delete
[ ] delete hooks

interface DeleteHandler {
  async delete(AnyBoardNode);
}

const node = repo.findById()
node.delete(deleteHandler: DeleteHandler)

Node {
  delete(deleteHandler: DeleteHandler) {
    this.props.children.forEach((child) => child.delete(deleteHandler));
    // TODO remove from domain object
    deletHandler.delete(this); // remove from Unit of Work
  }
}

Domain Objects

- Card
  - title?
  - height

ColumnBoard
  - title
  - context
  - visibility

