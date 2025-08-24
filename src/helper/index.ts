const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const commentsHelper = (comment: string) => {
  if (comment) {
    const updatedComment = comment.trim();
    if (updatedComment === " " || updatedComment === "undefined") {
      return "";
    }
    return updatedComment;
  }
  return "";
};
export { sleep, commentsHelper };
