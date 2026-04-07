import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class AddReplyDto {
  @IsNotEmpty()
  @IsString()
  commentId: string;

  @IsNotEmpty()
  @IsObject()
  reply: object; // ProseMirror/TipTap JSON doc

  @IsNotEmpty()
  @IsString()
  renderedHtml: string; // HTML converted by frontend
}
