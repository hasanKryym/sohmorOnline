const asyncWrapper = require("../middleware/async");
const { StatusCodes } = require("http-status-codes");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { BadRequestError, NotFoundError } = require("../errors");
const userPositions = require("../Enums/userEnums/positionsEnums");
const orderStatus = require("../Enums/orderEnums/ordersEnums");

const createOrder = asyncWrapper(async (req, res) => {
  const userId = req.user.userId;
  const { cart } = req.body;
  const shopId = cart[0].shop;

  const cartData = cart.map((cartProduct) => {
    return { product: cartProduct.product, quantity: cartProduct.quantity };
  });

  try {
    // Fetch the price for each product in the cart
    const productsWithPrice = await Promise.all(
      cartData.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new NotFoundError(`Product not found with id: ${item.product}`);
        }
        return {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
        };
      })
    );

    // Create the order
    const response = await Order.createOrder(userId, shopId, productsWithPrice);

    return res
      .status(
        response.success ? StatusCodes.OK : StatusCodes.INTERNAL_SERVER_ERROR
      )
      .json(response);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
});

const getOrders = asyncWrapper(async (req, res) => {
  const { status } = req.query;
  let orderData = {};
  if (req.user.role.position === userPositions.SHOP_ADMIN) {
    orderData.shopId = req.user.role.shop;
  } else if (req.user.role.position === userPositions.USER) {
    orderData.userId = req.user.userId;
  }

  if (!orderData.shopId && !orderData.userId)
    throw new BadRequestError(
      "please provide the shopId or the userId to retrieve the orders"
    );

  if (status) orderData.status = status;
  else orderData.status = orderStatus.PENDING;

  const response = await Order.getOrders(orderData, req.user.role.position);

  return res
    .status(
      response.success ? StatusCodes.OK : StatusCodes.INTERNAL_SERVER_ERROR
    )
    .json(response);
});

const updateOrder = asyncWrapper(async (req, res) => {
  const { orderId } = req.query;
  const { updatedOrder } = req.body;
  if (!orderId || !updatedOrder)
    throw new BadRequestError(
      "please provide the orderId and the updated order"
    );

  const response = await Order.updateOrder(orderId, updatedOrder);

  return res
    .status(
      response.success ? StatusCodes.OK : StatusCodes.INTERNAL_SERVER_ERROR
    )
    .json(response);
});

module.exports = { createOrder, getOrders, updateOrder };
