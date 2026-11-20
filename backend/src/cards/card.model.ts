import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Category } from '../generated/prisma/enums';

registerEnumType(Category, { name: 'CardCategory' });

@ObjectType()
export class Card {
  @Field(() => ID)
  id!: string;

  @Field(() => Category)
  category!: Category;

  @Field()
  text!: string;

  @Field()
  spicy!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
