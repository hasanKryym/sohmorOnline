const express = require("express");
const router = express.Router();

const {
  addShop,
  deleteShop,
  addDomain,
  getDomains,
  getShops,
  addCategory,
} = require("../controllers/shop");
const authenticate = require("../middleware/authentication");
const checkSiteAdmin = require("../middleware/admins/authSiteAdmin");
const checkShopAdmin = require("../middleware/admins/authShopAdmin");

router.route("/manage/add").post(authenticate, checkSiteAdmin, addShop);
router
  .route("/manage/delete/:id")
  .delete(authenticate, checkSiteAdmin, deleteShop);

router.route("/").get(getShops);

router.route("/manage/addDomain").post(authenticate, checkSiteAdmin, addDomain);
router.route("/domains").get(authenticate, checkSiteAdmin, getDomains);

router
  .route("/manage/addCategory")
  .post(authenticate, checkShopAdmin, addCategory);

module.exports = router;
