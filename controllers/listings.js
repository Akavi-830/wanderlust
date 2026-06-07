const axios = require("axios");
const User = require("../models/user");
const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const { category, q, sort } = req.query;

  let filter = {};

  if (category) {
    filter.category = category;
  }

  if (q && q.trim() !== "") {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } },
    ];
  }

  let query = Listing.find(filter);

  if (sort === "low") {
    query = query.sort({ price: 1 });
  }

  if (sort === "high") {
    query = query.sort({ price: -1 });
  }

  const allListings = await query;

  res.render("listings/index.ejs", {
    allListings,
    currCategory: category || null,
    currSearch: q || "",
    currSort: sort || "",
  });
};
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};
module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    res.redirect("/listings");
  }
  console.log(listing);

  res.render("listings/show.ejs", { listing });
};
module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);

  newListing.owner = req.user._id;

  newListing.images = req.files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));

  // Geocoding
  const address = `${newListing.location}, ${newListing.country}`;

  const geoResponse = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q: address,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "Wanderlust-App",
      },
    },
  );

  if (geoResponse.data.length > 0) {
    const lat = parseFloat(geoResponse.data[0].lat);
    const lon = parseFloat(geoResponse.data[0].lon);

    newListing.geometry = {
      type: "Point",
      coordinates: [lon, lat],
    };
  }

  await newListing.save();

  req.flash("success", "New listing created");

  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id);
  let originalImageUrl =
    listing.images?.length > 0 ? listing.images[0].url : listing.image?.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  let listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true },
  );

  if (req.files && req.files.length > 0) {
    listing.images = req.files.map((file) => ({
      url: file.path,
      filename: file.filename,
    }));

    await listing.save();
  }

  req.flash("success", "Listing updated");

  res.redirect(`/listings/${id}`);
};
module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;

  await Listing.findByIdAndDelete(id);
  req.flash("success", " listing deleted ");

  res.redirect("/listings");
};

module.exports.removeFromWishlist = async (req, res) => {
  const { id } = req.params;

  await User.findByIdAndUpdate(req.user._id, {
    $pull: {
      wishlist: id,
    },
  });

  req.flash("success", "Removed from wishlist");
  res.redirect(`/listings/${id}`);
};
module.exports.showWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");

  res.render("users/wishlist.ejs", {
    wishlist: user.wishlist,
  });
};

module.exports.addToWishlist = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(req.user._id);

  if (!user.wishlist.includes(id)) {
    user.wishlist.push(id);
    await user.save();

    req.flash("success", "Added to wishlist");
  } else {
    req.flash("error", "Already in wishlist");
  }

  res.redirect(`/listings/${id}`);
};
