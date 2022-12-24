import {Injectable} from '@nestjs/common';
import {Restaurant} from './entities/restaurant.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {CreateRestaurantDto} from './dtos/create-restaurant.dto';
import {UpdateRestaurantDto} from './dtos/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>
  ) {}
  getAll(): Promise<Restaurant[]> {
    return this.restaurantRepository.find();
  }

  createRestaurant(
    createRestaurantDto: CreateRestaurantDto
  ): Promise<Restaurant> {
    const newRestaurant = this.restaurantRepository.create(createRestaurantDto);
    return this.restaurantRepository.save(newRestaurant);
  }

  updateRestaurant({id, data}: UpdateRestaurantDto) {
    return this.restaurantRepository.update(id, {...data});
  }
}
