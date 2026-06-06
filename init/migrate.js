const mongoose = require("mongoose");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wonderlust";

async function main() {
  await mongoose.connect(MONGO_URL);

  console.log("Connected to DB");

  let listings = await Listing.find({});

  for (let listing of listings) {

    // old corrupted string
    let oldImage = listing.image.url;

    if (typeof oldImage === "string" && oldImage.includes("url:")) {

      let match = oldImage.match(/url: '([^']+)'/);

      let imageUrl = match ? match[1] : "";

      listing.image = {
        url: imageUrl,
        filename: "listingimage",
      };

      await listing.save();

      console.log(`Fixed: ${listing.title}`);
    }
  }

  console.log("Migration completed");

  mongoose.connection.close();
}

main().catch((err) => {
  console.log(err);
});