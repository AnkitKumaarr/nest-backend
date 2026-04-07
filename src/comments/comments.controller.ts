import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AddCommentDto } from './dto/add-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AddReplyDto } from './dto/add-reply.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { CustomAuthGuard } from '../auth/guards/auth.guard';

@Controller('comments')
@UseGuards(CustomAuthGuard)
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  private getAuthor(req: any): { userId: string; name: string } {
    const name = req.user.firstName
      ? `${req.user.firstName} ${req.user.lastName ?? ''}`.trim()
      : req.user.email;
    return { userId: req.user.sub, name };
  }

  @Post()
  addComment(@Body() dto: AddCommentDto, @Request() req: any) {
    return this.service.addComment(dto.taskId, dto.comment, dto.renderedHtml, this.getAuthor(req));
  }

  @Post('list')
  listComments(@Body() dto: ListCommentsDto) {
    return this.service.listComments(dto.taskId, dto.page ?? 1, dto.limit ?? 20);
  }

  @Put()
  updateComment(@Body() dto: UpdateCommentDto, @Request() req: any) {
    return this.service.updateComment(dto.commentId, dto.comment, dto.renderedHtml, req.user.sub);
  }

  @Delete(':id')
  deleteComment(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteComment(id, req.user.sub);
  }

  @Post('reply')
  addReply(@Body() dto: AddReplyDto, @Request() req: any) {
    return this.service.addReply(dto.commentId, dto.reply, dto.renderedHtml, this.getAuthor(req));
  }

  @Put('reply')
  updateReply(@Body() dto: UpdateReplyDto, @Request() req: any) {
    return this.service.updateReply(dto.commentId, dto.replyId, dto.reply, dto.renderedHtml, req.user.sub);
  }

  @Delete('reply/:commentId/:replyId')
  deleteReply(
    @Param('commentId') commentId: string,
    @Param('replyId') replyId: string,
    @Request() req: any,
  ) {
    return this.service.deleteReply(commentId, replyId, req.user.sub);
  }
}
