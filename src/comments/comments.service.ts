import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { renderHtml, extractPreview } from '../common/utils/content.util';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async addComment(
    taskId: string,
    comment: object,
    commentBy: { userId: string; name: string },
  ) {
    const renderedHtml = renderHtml(comment);
    const contentPreview = extractPreview(comment);

    await this.prisma.comment.create({
      data: { taskId, comment, renderedHtml, contentPreview, commentBy } as any,
    });
    return { message: 'Comment added successfully' };
  }

  async listComments(taskId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const topLevelFilter = {
      taskId,
      OR: [{ parentId: null }, { parentId: { isSet: false } }],
    };

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: topLevelFilter,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { replies: { orderBy: { createdAt: 'asc' } } },
      }),
      this.prisma.comment.count({ where: topLevelFilter }),
    ]);
    return { data: comments, meta: { page, limit, total } };
  }

  async updateComment(
    commentId: string,
    comment: object,
    userId: string,
  ) {
    const existing = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) throw new NotFoundException('Comment not found');

    const commentBy = existing.commentBy as any;
    if (commentBy?.userId && commentBy.userId !== userId)
      throw new ForbiddenException('You can only edit your own comments');

    const renderedHtml = renderHtml(comment);
    const contentPreview = extractPreview(comment);

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { comment, renderedHtml, contentPreview } as any,
    });
    return { message: 'Comment updated successfully' };
  }

  async deleteComment(commentId: string, userId: string) {
    const existing = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) throw new NotFoundException('Comment not found');

    const commentBy = existing.commentBy as any;
    if (commentBy?.userId && commentBy.userId !== userId)
      throw new ForbiddenException('You can only delete your own comments');

    await this.prisma.comment.deleteMany({ where: { parentId: commentId } });
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted successfully' };
  }

  async addReply(
    commentId: string,
    reply: object,
    replyBy: { userId: string; name: string },
  ) {
    const parent = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!parent) throw new NotFoundException('Comment not found');

    const renderedHtml = renderHtml(reply);
    const contentPreview = extractPreview(reply);

    await this.prisma.comment.create({
      data: {
        taskId: parent.taskId,
        comment: reply,
        renderedHtml,
        contentPreview,
        parentId: commentId,
        commentBy: replyBy,
      } as any,
    });
    return { message: 'Reply added successfully' };
  }

  async deleteReply(replyId: string, userId: string) {
    const existing = await this.prisma.comment.findUnique({ where: { id: replyId } });
    if (!existing) throw new NotFoundException('Reply not found');

    const commentBy = existing.commentBy as any;
    if (commentBy?.userId && commentBy.userId !== userId)
      throw new ForbiddenException('You can only delete your own replies');

    await this.prisma.comment.delete({ where: { id: replyId } });
    return { message: 'Reply deleted successfully' };
  }
}
