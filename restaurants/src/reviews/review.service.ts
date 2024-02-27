import { Injectable, NotFoundException } from '@nestjs/common';

// NATS
import {
  EventData,
  ReviewCreatedEvent,
  ReviewUpdatedEvent,
  ReviewDeletedEvent,
} from '@dine_ease/common';

// Services
import { RestaurantsService } from 'src/restaurants/restaurants.service';

// Database
import { InjectModel } from '@nestjs/mongoose';
import { Review, ReviewDocument, ReviewModel } from './models/review.entity';
import { RestaurantDocument } from 'src/restaurants/models/restaurant.entity';

@Injectable()
export class ReviewService {
  constructor(
    private readonly restaurantService: RestaurantsService,
    @InjectModel(Review.name)
    private readonly reviewModel: ReviewModel,
  ) {}

  // find restaurant by version
  async findReviewByVersion(event: EventData): Promise<ReviewDocument> {
    const found = await this.reviewModel.findByEvent(event);
    if (!found) throw new NotFoundException('Review not found');
    return found;
  }

  // create review
  async reviewCreated(data: ReviewCreatedEvent): Promise<void> {
    const { id, restaurantId, rating, userId, content } = data;

    const restaurant: RestaurantDocument =
      await this.restaurantService.findDeletedRestaurantById(restaurantId);

    const { rating: stars, count } = restaurant;
    const updatedRating = ((stars * count + rating) / (count + 1)).toFixed(1);

    restaurant.set({ rating: updatedRating, count: count + 1 });
    await restaurant.save();

    const newData = { _id: id, restaurantId, rating, userId, content };
    await this.reviewModel.create(newData);
  }

  // update review
  async reviewUpdated(data: ReviewUpdatedEvent): Promise<void> {
    const { id, version, content, restaurantId, previousRating, rating } = data;

    const restaurant: RestaurantDocument =
      await this.restaurantService.findDeletedRestaurantById(restaurantId);

    const event: EventData = { id, version };
    const found: ReviewDocument = await this.findReviewByVersion(event);
    found.set({ content, rating });
    await found.save();

    const { rating: stars, count } = restaurant;
    const updatedRating = (
      (stars * count - previousRating + rating) /
      count
    ).toFixed(1);

    restaurant.set({ rating: updatedRating });
    await restaurant.save();
  }

  // delete review
  async reviewDeleted(data: ReviewDeletedEvent): Promise<void> {
    const { id, version, restaurantId, rating } = data;

    const restaurant: RestaurantDocument =
      await this.restaurantService.findDeletedRestaurantById(restaurantId);

    const event: EventData = { id, version };
    const found: ReviewDocument = await this.findReviewByVersion(event);
    found.set({ isDeleted: true });
    await found.save();

    const { rating: stars, count } = restaurant;
    const updatedRating = ((stars * count - rating) / (count - 1)).toFixed(1);

    restaurant.set({ rating: updatedRating, count: count - 1 });
    await restaurant.save();
  }
}
