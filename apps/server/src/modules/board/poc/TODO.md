[ ] BoardNodeRepo additional methods
  [ ] `findById` - depth
  [ ] `findByIds`
  [ ] `getTitlesByIds`
  [ ] `countBoardUsageForExternalTools`
  [ ] (`findParentOfId`)
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