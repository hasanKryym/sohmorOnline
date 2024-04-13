const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  UnauthenticatedError,
  NotFoundError,
  InternalServerError,
} = require("../errors/index");
const asyncWrapper = require("../middleware/async");
const { Shop, Category, ShopRegistration } = require("../models/Shop");
const userPositions = require("../Enums/userEnums/positionsEnums");
const Domain = require("../models/Domain");
const User = require("../models/User");
const registrationRequestStatus = require("../Enums/shopEnums/shopRegistrationStatus");

const addShop = asyncWrapper(async (req, res) => {
  const {
    name,
    description,
    image,
    products,
    sliderImages,
    address,
    phoneNumber,
    domain,
  } = req.body;

  if (!name || !description || !address || !phoneNumber || !domain) {
    throw new BadRequestError("Required fields are missing.");
  }

  const shopData = {
    name,
    description,
    image,
    products,
    sliderImages,
    address,
    phoneNumber,
    domain,
  };

  const newShop = await Shop.createShop(shopData);

  res
    .status(StatusCodes.CREATED)
    .json({ shop: newShop, success: true, message: "shop added successfully" });
});

const editShop = asyncWrapper(async (req, res) => {
  const shopId = req.user.role.shop;

  const {
    name,
    description,
    image,
    products,
    sliderImages,
    address,
    phoneNumber,
    domain,
  } = req.body;

  if (!name || !description || !address || !phoneNumber || !domain) {
    throw new BadRequestError("Required fields are missing.");
  }

  const shopData = {
    name,
    description,
    image,
    products,
    sliderImages,
    address,
    phoneNumber,
    domain,
  };

  const updatedShop = await Shop.editShop(shopId, shopData);

  res.status(StatusCodes.OK).json({
    shop: updatedShop,
    success: true,
    message: "shop updated successfully",
  });
});

const deleteShop = asyncWrapper(async (req, res) => {
  const { id: shopId } = req.params;

  if (!shopId) {
    throw new BadRequestError("Please provide the shop id");
  }

  const deletedShop = await Shop.deleteShop(shopId);

  if (deletedShop) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Shop deleted successfully",
      deletedShop,
    });
  } else {
    throw new InternalServerError("Unable to delete shop");
  }
});

const shopActivation = asyncWrapper(async (req, res) => {
  const { shopId, isActive } = req.body;
  const updatedShop = await Shop.findByIdAndUpdate(shopId, {
    isActive: isActive,
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "shop activation updated successfully",
    shop: updatedShop,
  });
});

const getShops = asyncWrapper(async (req, res) => {
  const { search, domain, categories, minRating, maxRating, shopId, all } =
    req.query;
  const queryObject = {};

  if (shopId) queryObject._id = shopId;

  if (domain && typeof domain === "string" && domain.trim() !== "") {
    const domainProperty = { $in: [domain] }; // Use exact match for domain
    queryObject.domain = domainProperty;
  }

  if (categories && typeof domain === "string" && categories.trim() !== "") {
    const categoriesProperty = { $in: [categories] };
    queryObject.categories = categoriesProperty;
  }

  if (search) {
    // Perform case-insensitive search across multiple fields
    queryObject.$or = [
      { name: { $regex: new RegExp(search, "i") } }, // The "i" flag makes the search case-insensitive, so it will match both upper and lower case letters
      { description: { $regex: new RegExp(search, "i") } },
      // { categories: { $in: [new RegExp(search, "i")] } }, // Use $in operator for array field
    ];
  }

  // Filter by minimum and/or maximum rating if provided
  if (minRating || maxRating) {
    queryObject.rating = {};
    if (minRating) queryObject.rating.$gte = parseInt(minRating); // Filter for minimum rating
    if (maxRating) queryObject.rating.$lte = parseInt(maxRating); // Filter for maximum rating
  }

  // Check if the user is a site admin
  // const { role } = req.user.data;
  // if (!req.user || req.user.role.position !== userPositions.SITE_ADMIN || !all)
  if (!all) queryObject.isActive = true;

  const shops = await Shop.getShops(queryObject);

  if (!shops || shops.length === 0)
    throw new NotFoundError("No shops available");

  return res
    .status(StatusCodes.OK)
    .json({ success: true, shops, message: "shops retrieved successfully" });
});

const addDomain = asyncWrapper(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new BadRequestError("please provide the name of the domain");

  const newDomain = await Domain.addDomain({ name });

  return res
    .status(StatusCodes.OK)
    .json({ success: true, newDomain, message: "Domain added successfully" });
});

const getDomains = asyncWrapper(async (req, res) => {
  const domains = await Domain.getDomains();
  return res.status(StatusCodes.OK).json({
    success: true,
    domains,
    message: "domains retrieved successfully",
  });
});

const addCategory = asyncWrapper(async (req, res) => {
  const shop = req.user.role.shop;
  const { category: name } = req.body;

  if (!shop || !name) throw new BadRequestError("please provide category name");

  const categoryData = {
    name,
    shop,
  };

  const category = await Category.createCategory(categoryData);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    category,
    message: "category created successfully",
  });
});

const getCategories = asyncWrapper(async (req, res) => {
  const { shopId } = req.query;
  if (!shopId) throw new BadRequestError("Please provide shopId");

  const categories = await Shop.getShopCategories(shopId);

  if (!categories) throw new NotFoundError("no categories found for this shop");

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "categories retrieved successfully",
    categories,
  });
});

// SHOP REGISTRATION

const addRegistrationRequest = asyncWrapper(async (req, res) => {
  const { requestData } = req.body;
  if (!requestData) {
    throw new BadRequestError("Please provide the request data");
  }

  const { shopInfo, adminInfo } = requestData;

  // Check if the shop name already exists in the Shop schema
  const existingShop = await Shop.findOne({ name: shopInfo.name });
  if (existingShop) {
    throw new BadRequestError("Shop name already exists");
  }

  // Check if the admin email already exists in the User schema
  const existingAdmin = await User.findOne({ email: adminInfo.email });
  if (existingAdmin) {
    throw new BadRequestError("Admin email already exists");
  }

  // Check if the shop name already exists in the ShopRegistration schema
  const existingRequest = await ShopRegistration.findOne({
    "shopInfo.name": shopInfo.name,
  });
  if (existingRequest) {
    throw new BadRequestError(
      "Shop name already exists in a registration request"
    );
  }

  // Check if the admin email already exists in the ShopRegistration schema
  const existingRequestAdmin = await ShopRegistration.findOne({
    "adminInfo.email": adminInfo.email,
  });
  if (existingRequestAdmin) {
    throw new BadRequestError(
      "Admin email already exists in a registration request"
    );
  }

  const newRequest = await ShopRegistration.addRegistrationRequest(requestData);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message:
      "Request added successfully; please wait for the admin to review your request. You'll be notified when your shop is ready.",
    newRequest,
  });
});

const changeRequestStatus = asyncWrapper(async (req, res) => {
  const { requestId, newStatus } = req.body;
  const updatedRequest = await ShopRegistration.changeStatus(
    requestId,
    newStatus
  );
  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "status updated successfully", newStatus });
});

const getRegistrationRequests = asyncWrapper(async (req, res) => {
  let { status } = req.query;
  if (!status) status = registrationRequestStatus.PENDING;

  const requests = await ShopRegistration.getRegistrationRequests(status);

  return res.status(StatusCodes.ACCEPTED).json({
    success: true,
    message: "shop registration requests retrieved successfully",
    requests,
  });
});

module.exports = {
  addShop,
  editShop,
  deleteShop,
  shopActivation,
  getShops,
  addDomain,
  getDomains,
  addCategory,
  getCategories,
  addRegistrationRequest,
  changeRequestStatus,
  getRegistrationRequests,
};
