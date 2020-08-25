import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const checkCustomers = await this.customersRepository.findById(customer_id);

    if (!checkCustomers) {
      throw new AppError('Não foi possivel encontrar o cliente');
    }

    const checkProducts = await this.productsRepository.findAllById(products);

    if (!checkProducts.length) {
      throw new AppError('Não foi possivél encontrar os produtos, pelo id');
    }

    const checkProductsID = checkProducts.map(product => product.id);

    const checkInexistentProduct = products.filter(
      product => !checkProductsID.includes(product.id),
    );

    if (checkInexistentProduct.length) {
      throw new AppError('Não foi possivel encontrar o produto');
    }

    const checkProductWithNoQuantity = products.filter(
      product =>
        checkProducts.filter(p => p.id === product.id)[0].quantity <
        product.quantity,
    );

    if (checkProductWithNoQuantity.length) {
      throw new AppError(
        `A quantidade ${checkProductWithNoQuantity[0].quantity} não está disponivel ${checkProductWithNoQuantity}`,
      );
    }

    const serializedProduct = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: checkProducts.filter(p => p.id === product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer: checkCustomers,
      products: serializedProduct,
    });

    const { order_products } = order;

    const orderProductQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity:
        checkProducts.filter(p => p.id === product.product_id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderProductQuantity);

    return order;
  }
}

export default CreateOrderService;
