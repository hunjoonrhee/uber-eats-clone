import {Injectable} from '@nestjs/common';
import {Restaurant} from './entities/restaurant.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {ILike, Like, Repository} from 'typeorm';
import {CreateRestaurantInput, CreateRestaurantOutput} from './dtos/create-restaurant.dto';
import {User} from 'src/users/entities/user.entity';
import {Category} from './entities/category.entity';
import {EditRestaurantInput, EditRestaurantOutput} from './dtos/edit-restaurant.dto';
import {CategoryRepository} from './repositories/category.repository';
import {DeleteRestaurantInput, DeleteRestaurantOutput} from './dtos/delete-restaurant.dto';
import {CoreOutput} from 'src/common/dtos/output.dto';
import {AllCategoriesOutput} from './dtos/all-categories.dto';
import {CategoryInput, CategoryOutput} from './dtos/category.dto';
import {RestaurantsInput, RestaurantsOutput} from './dtos/restaurants.dto';
import {RestaurantInput} from './dtos/restaurant.dto';
import {RestaurantOutput} from './dtos/restaurant.dto';
import {SearchRestaurantInput, SearchRestaurantOutput} from './dtos/search-restaurant.dto';
import {CreateDishInput, CreateDishOutput} from './dtos/create-dish.dto';
import {Dish} from './entities/dish.entity';
import {EditDishInput, EditDishOutput} from './dtos/edit.dish.dto';
import {DeleteDishInput, DeleteDishOutput} from './dtos/delete-dish.dto';
import {DEFAULT_FACTORY_CLASS_METHOD_KEY} from '@nestjs/common/module-utils/constants';

@Injectable()
export class RestaurantsService {
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurantRepository: Repository<Restaurant>,
        // @InjectRepository(Category)
        private readonly categoryRepository: CategoryRepository,
        @InjectRepository(Dish)
        private readonly dishRepository: Repository<Dish>
    ) {}

    async PrerequisitesForEditingOrDeletingRestaurant(restaurantId: number, owner: User): Promise<CoreOutput> {
        const restaurant = await this.restaurantRepository.findOne({
            where: {id: restaurantId},
            loadRelationIds: true,
        });
        if (!restaurant) {
            return {
                ok: false,
                error: 'Restaurant not found',
            };
        }

        if (owner.id !== restaurant.ownerId) {
            return {
                ok: false,
                error: 'You can not edit / delete a restaurant that you do not own',
            };
        }
    }

    async createRestaurant(owner: User, createRestaurantInput: CreateRestaurantInput): Promise<CreateRestaurantOutput> {
        try {
            const newRestaurant = this.restaurantRepository.create(createRestaurantInput);
            newRestaurant.owner = owner;
            const category = await this.categoryRepository.getOrCreate(createRestaurantInput.categoryName);
            newRestaurant.category = category;
            await this.restaurantRepository.save(newRestaurant);
            return {ok: true};
        } catch {
            return {
                ok: false,
                error: 'Could not create restaurant',
            };
        }
    }

    async editRestaurant(owner: User, editRestaurantInput: EditRestaurantInput): Promise<EditRestaurantOutput> {
        try {
            this.PrerequisitesForEditingOrDeletingRestaurant(editRestaurantInput.restaurantId, owner);
            let category: Category = null;
            if (editRestaurantInput.categoryName) {
                category = await this.categoryRepository.getOrCreate(editRestaurantInput.categoryName);
            }

            await this.restaurantRepository.save([
                {
                    id: editRestaurantInput.restaurantId,
                    ...editRestaurantInput,
                    ...(category && {category}),
                },
            ]);
            return {ok: true};
        } catch {
            return {
                ok: false,
                error: 'Could not edit restaurant',
            };
        }
    }
    async deleteRestaurant(owner: User, {restaurantId}: DeleteRestaurantInput): Promise<DeleteRestaurantOutput> {
        try {
            this.PrerequisitesForEditingOrDeletingRestaurant(restaurantId, owner);
            await this.restaurantRepository.delete(restaurantId);
            return {ok: true};
        } catch {
            return {
                ok: false,
                error: 'Could not delete restaurant',
            };
        }
    }

    async allCategories(): Promise<AllCategoriesOutput> {
        try {
            const categories = await this.categoryRepository.find();
            return {
                ok: true,
                categories,
            };
        } catch {
            return {
                ok: false,
                error: 'Could not load categories',
            };
        }
    }

    countRestaurants(category: Category): Promise<number> {
        return this.restaurantRepository.count({where: {category: {id: category.id}}});
    }

    async findCategoryBySlug({slug, page}: CategoryInput): Promise<CategoryOutput> {
        try {
            const category = await this.categoryRepository.findOne({where: {slug}});
            if (!category) {
                return {
                    ok: false,
                    error: 'Category not found',
                };
            }
            const restaurants = await this.restaurantRepository.find({
                where: {category: {id: category.id}},
                take: 5,
                skip: (page - 1) * 5,
            });
            category.restaurants = restaurants;
            const totalResults = await this.countRestaurants(category);
            return {
                ok: true,
                category,
                totalPages: Math.ceil(totalResults / 25),
            };
        } catch {
            return {
                ok: false,
                error: 'Could not find categories by slug',
            };
        }
    }

    async getAllRestaurants({page}: RestaurantsInput): Promise<RestaurantsOutput> {
        try {
            const [results, totalResults] = await this.restaurantRepository.findAndCount({skip: (page - 1) * 5, take: 5});
            return {
                ok: true,
                results,
                totalPages: Math.ceil(totalResults / 5),
                totalResults,
            };
        } catch {
            return {
                ok: false,
                error: 'Could not load all restaurants',
            };
        }
    }

    async getRestaurant({restaurantId}: RestaurantInput): Promise<RestaurantOutput> {
        try {
            const restaurant = await this.restaurantRepository.findOne({where: {id: restaurantId}, relations: ['menu']});
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Could not find restaurant',
                };
            }
            return {
                ok: true,
                restaurant,
            };
        } catch {
            return {
                ok: false,
                error: 'Could not find restaurant',
            };
        }
    }

    async searchRestaurantByName({query, page}: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
        try {
            const [restaurants, totalResults] = await this.restaurantRepository.findAndCount({
                where: {name: ILike(`%${query}%`)},
                skip: (page - 1) * 5,
                take: 5,
            });
            if (!restaurants) {
                return {
                    ok: false,
                    error: 'Could not find restaurants',
                };
            }
            return {
                ok: true,
                restaurants,
                totalResults,
                totalPages: Math.ceil(totalResults / 5),
            };
        } catch {
            return {
                ok: false,
                error: 'Could not find restaurants',
            };
        }
    }

    async createDish(owner: User, createDishInput: CreateDishInput): Promise<CreateDishOutput> {
        try {
            const restaurant = await this.restaurantRepository.findOne({where: {id: createDishInput.restaurantId}});
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found',
                };
            }
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: 'You can not do that, because you are not the owner of this restaurant',
                };
            }
            await this.dishRepository.save(this.dishRepository.create({...createDishInput, restaurant}));
            return {ok: true};
        } catch {
            return {
                ok: false,
                error: 'Could not create dish',
            };
        }
    }
    async editDish(owner: User, editDishInput: EditDishInput): Promise<EditDishOutput> {
        try {
            const dish = await this.dishRepository.findOne({where: {id: editDishInput.dishId}, relations: ['restaurant']});
            if (!dish) {
                return {
                    ok: false,
                    error: 'Dish not found',
                };
            }
            if (owner.id !== dish.restaurant.ownerId) {
                return {
                    ok: false,
                    error: 'You can not do that, because you are not the owner of this restaurant',
                };
            }
            await this.dishRepository.save([
                {
                    id: editDishInput.dishId,
                    ...editDishInput,
                },
            ]);
            return {ok: true};
        } catch {
            return {
                ok: false,
                error: 'Could not edit dish',
            };
        }
    }

    async deleteDish(owner: User, {dishId}: DeleteDishInput): Promise<DeleteDishOutput> {
        try {
            const dish = await this.dishRepository.findOne({where: {id: dishId}, relations: ['restaurant']});
            if (!dish) {
                return {
                    ok: false,
                    error: 'Dish not found',
                };
            }

            if (owner.id !== dish.restaurant.ownerId) {
                return {
                    ok: false,
                    error: 'You can not do that, because you are not the owner of this restaurant',
                };
            }

            await this.dishRepository.delete(dishId);
            return {ok: true};
        } catch {
            return {
                ok: false,
                error: 'Could not delete dish',
            };
        }
    }
}
