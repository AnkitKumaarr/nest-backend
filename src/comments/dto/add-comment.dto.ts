import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class AddCommentDto {
  @IsNotEmpty()
  @IsString()
  taskId: string;

  @IsNotEmpty()
  @IsObject()
  comment: object; // ProseMirror/TipTap JSON doc
}
