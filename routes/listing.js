const User = require("../models/user");
const express = require("express");
const router = express.Router();

const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");

const upload = multer({ storage });

const {
  isLoggedIn,
  isOwner,
  validateListing,
  validateReview,
} = require("../middleware.js");

// INDEX ROUTE
router.get("/", wrapAsync(listingController.index));

// NEW ROUTE
router.get("/new", isLoggedIn, listingController.renderNewForm);
router.post(
  "/:id/wishlist",
  isLoggedIn,
  wrapAsync(listingController.addToWishlist),
);

router.delete(
  "/:id/wishlist",
  isLoggedIn,
  wrapAsync(listingController.removeFromWishlist),
);

router.get(
  "/wishlist/all",
  isLoggedIn,
  wrapAsync(listingController.showWishlist),
);
// SHOW ROUTE
router.get("/:id", wrapAsync(listingController.showListing));
router.post("/:id/book", isLoggedIn, wrapAsync(listingController.bookListing));

// CREATE ROUTE
router.post(
  "/",

  upload.array("listing[images]", 5),
  validateListing,
  wrapAsync(listingController.createListing),
);
// router.post("/", upload.single("listing[image]"), (req, res) => {
//   res.send(req.file);
// });

// EDIT ROUTE

router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm),
);

// UPDATE ROUTE
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  upload.array("listing[images]", 5),
  validateListing,
  wrapAsync(listingController.updateListing),
);

// DELETE ROUTE
router.delete(
  "/:id",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.deleteListing),
);

module.exports = router;
