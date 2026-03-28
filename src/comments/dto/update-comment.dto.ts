import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class UpdateCommentDto {
  @IsNotEmpty()
  @IsString()
  commentId: string;

  @IsNotEmpty()
  @IsObject()
  comment: object; // ProseMirror/TipTap JSON doc
}
