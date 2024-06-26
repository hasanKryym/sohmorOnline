const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../errors/index");
const asyncWrapper = require("../middleware/async");

const register = asyncWrapper(async (req, res) => {
  const { name, email, password, address, number, role } = req.body;
  if (!name || !email || !password || !address || !number)
    throw new BadRequestError("Please provide name, email, and password");

  const userData = { name, email, password, address, number, role };
  const { user, token } = await User.register(userData, false);

  return res.status(StatusCodes.CREATED).json({
    token,
    user,
    success: true,
    message: "Registered successfully",
  });
});

const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new BadRequestError("please provide email and password");

  const { user, token } = await User.login(email, password);

  return res.status(StatusCodes.OK).json({
    user,
    token,
    success: true,
    message: "Logged in successfully",
  });
});

module.exports = {
  register,
  login,
};
