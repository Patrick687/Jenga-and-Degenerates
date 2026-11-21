import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Category } from '../generated/prisma/enums';
import { CARD_TEXT_MAX_LENGTH, CARD_TEXT_MIN_LENGTH } from './card.inputs';

export const SUBMITTER_MAX_LENGTH = 24;

const tidy = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

/** A public suggestion from a guest. */
@InputType()
export class SubmitCardInput {
  @Field(() => Category)
  @IsEnum(Category)
  category!: Category;

  @Field()
  @Transform(tidy)
  @IsString()
  @MinLength(CARD_TEXT_MIN_LENGTH, { message: 'Your card is too short.' })
  @MaxLength(CARD_TEXT_MAX_LENGTH, {
    message: `Cards can be at most ${CARD_TEXT_MAX_LENGTH} characters. Trim it down a little.`,
  })
  @Matches(/^[^\p{C}]+$/u, { message: 'Your card has characters we can’t use.' })
  text!: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  spicy!: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Transform(tidy)
  @IsString()
  @MaxLength(SUBMITTER_MAX_LENGTH, { message: 'Keep your name to 24 characters.' })
  submittedBy?: string | null;
}
