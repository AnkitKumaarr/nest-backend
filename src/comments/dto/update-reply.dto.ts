import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class UpdateReplyDto {
  @IsNotEmpty()
  @IsString()
  commentId: string;

  @IsNotEmpty()
  @IsString()
  replyId: string;

  @IsNotEmpty()
  @IsObject()
  reply: object; // ProseMirror/TipTap JSON doc

  @IsNotEmpty()
  @IsString()
  renderedHtml: string; // HTML converted by frontend
}
