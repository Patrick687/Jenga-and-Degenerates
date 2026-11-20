import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Category } from '../generated/prisma/enums';

export const CARD_TEXT_MIN_LENGTH = 3;
export const CARD_TEXT_MAX_LENGTH = 160;

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

@InputType()
export class CreateCardInput {
  @Field(() => Category)
  @IsEnum(Category)
  category!: Category;

  @Field()
  @Transform(trim)
  @IsString()
  @MinLength(CARD_TEXT_MIN_LENGTH, { message: 'Card text is too short.' })
  @MaxLength(CARD_TEXT_MAX_LENGTH, {
    message: `Card text must be at most ${CARD_TEXT_MAX_LENGTH} characters.`,
  })
  text!: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  spicy!: boolean;
}

@InputType()
export class UpdateCardInput {
  @Field(() => Category, { nullable: true })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(CARD_TEXT_MIN_LENGTH, { message: 'Card text is too short.' })
  @MaxLength(CARD_TEXT_MAX_LENGTH, {
    message: `Card text must be at most ${CARD_TEXT_MAX_LENGTH} characters.`,
  })
  text?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  spicy?: boolean;
}
