import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Category, SubmissionStatus } from '../generated/prisma/enums';

registerEnumType(SubmissionStatus, { name: 'SubmissionStatus' });

@ObjectType()
export class CardSubmission {
  @Field(() => ID) id!: string;
  @Field(() => Category) category!: Category;
  @Field() text!: string;
  @Field() spicy!: boolean;
  @Field(() => String, { nullable: true }) submittedBy?: string | null;
  @Field(() => SubmissionStatus) status!: SubmissionStatus;
  @Field(() => Date) createdAt!: Date;
}
