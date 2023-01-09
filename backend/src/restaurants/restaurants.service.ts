import {Injectable} from '@nestjs/common';
import {Restaurant} from './entities/restaurant.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {CreateRestaurantInput, CreateRestaurantOutput} from './dtos/create-restaurant.dto';
import {User} from 'src/users/entities/user.entity';
import {Category} from './entities/category.entity';

@Injectable()
export class RestaurantsService {
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurantRepository: Repository<Restaurant>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>
    ) {}
    async createRestaurant(owner: User, createRestaurantInput: CreateRestaurantInput): Promise<CreateRestaurantOutput> {
        try {
            console.log(owner);
            const newRestaurant = this.restaurantRepository.create(createRestaurantInput);
            newRestaurant.owner = owner;
            const categoryName = createRestaurantInput.categoryName.trim().toLowerCase();
            const categorySlug = categoryName.replace(/ /g, '-');
            let category = await this.categoryRepository.findOneBy({slug: categorySlug});
            if (!category) {
                category = await this.categoryRepository.save(this.categoryRepository.create({slug: categorySlug, name: categoryName}));
            }
            await this.restaurantRepository.save(newRestaurant);
            return {ok: true};
        } catch {
            return {
                ok: false,
                error: 'Could not create restaurant',
            };
        }
    }
}
