import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { extractPreview } from '../common/utils/content.util';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async addComment(
    taskId: string,
    comment: object,
    renderedHtml: string,
    commentBy: { userId: string; name: string },
  ) {
    const contentPreview = extractPreview(comment);

    await this.prisma.comment.create({
      data: { taskId, comment, renderedHtml, contentPreview, commentBy, replies: [] } as any,
    });
    return { message: 'Comment added successfully' };
  }

  async listComments(taskId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { taskId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where: { taskId } }),
    ]);
    return { data: comments, meta: { page, limit, total } };
  }

  async updateComment(
    commentId: string,
    comment: object,
    renderedHtml: string,
    userId: string,
  ) {
    const existing = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) throw new NotFoundException('Comment not found');

    const commentBy = existing.commentBy as any;
    if (commentBy?.userId && commentBy.userId !== userId)
      throw new ForbiddenException('You can only edit your own comments');

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

    // replies are embedded — deleting the comment removes all replies automatically
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted successfully' };
  }

  async addReply(
    commentId: string,
    reply: object,
    renderedHtml: string,
    replyBy: { userId: string; name: string },
  ) {
    const existing = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) throw new NotFoundException('Comment not found');

    const contentPreview = extractPreview(reply);
    const now = new Date();
    const newReply = {
      id: randomBytes(12).toString('hex'),
      replyBy,
      comment: reply,
      renderedHtml,
      parentId: commentId,
      contentPreview,
      createdAt: now,
      updatedAt: now,
    };

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { replies: { push: newReply } } as any,
    });
    return { message: 'Reply added successfully' };
  }

  async updateReply(
    commentId: string,
    replyId: string,
    reply: object,
    renderedHtml: string,
    userId: string,
  ) {
    const existing = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) throw new NotFoundException('Comment not found');

    const replies = (existing as any).replies as any[];
    const target = replies?.find((r: any) => r.id === replyId);
    if (!target) throw new NotFoundException('Reply not found');

    if (target.replyBy?.userId && target.replyBy.userId !== userId)
      throw new ForbiddenException('You can only edit your own replies');

    const contentPreview = extractPreview(reply);
    const updatedReplies = replies.map((r: any) =>
      r.id === replyId
        ? { ...r, comment: reply, renderedHtml, contentPreview, updatedAt: new Date() }
        : r,
    );

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { replies: { set: updatedReplies } } as any,
    });
    return { message: 'Reply updated successfully' };
  }

  async deleteReply(commentId: string, replyId: string, userId: string) {
    const existing = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) throw new NotFoundException('Comment not found');

    const replies = (existing as any).replies as any[];
    const target = replies?.find((r: any) => r.id === replyId);
    if (!target) throw new NotFoundException('Reply not found');

    if (target.replyBy?.userId && target.replyBy.userId !== userId)
      throw new ForbiddenException('You can only delete your own replies');

    const updatedReplies = replies.filter((r: any) => r.id !== replyId);

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { replies: { set: updatedReplies } } as any,
    });
    return { message: 'Reply deleted successfully' };
  }
}
