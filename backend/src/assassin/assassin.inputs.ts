import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 24;

const tidyName = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

@InputType()
export class JoinPartyInput {
  @Field()
  @Transform(tidyName)
  @IsString()
  @MinLength(NAME_MIN_LENGTH, { message: 'Your name needs at least 2 characters.' })
  @MaxLength(NAME_MAX_LENGTH, { message: 'Your name can be at most 24 characters.' })
  @Matches(/^[^\p{C}]+$/u, { message: 'Your name has characters we can’t use.' })
  name!: string;
}
