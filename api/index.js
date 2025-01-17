require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("@shopify/shopify-api/adapters/node");
const { shopifyApi, ApiVersion, Session } = require("@shopify/shopify-api");
const { restResources } = require("@shopify/shopify-api/rest/admin/2023-04");

const app = express();
app.use(cors());
app.use(express.json());

const port = 8080 || process.env.PORT;

const shopify = shopifyApi({
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  apiVersion: ApiVersion.April23,
  isCustomStoreApp: true,
  adminApiAccessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  isEmbeddedApp: false,
  hostName: process.env.SHOPIFY_STORE_URL,
  // Mount REST resources.
  restResources,
});

// start api
app.get("/", async (req, res) => {
  try {
    const session = shopify.session.customAppSession(
      process.env.SHOPIFY_STORE_URL
    );
    const { count: customerCount } = await shopify.rest.Customer.count({
      session,
    });

    res
      .status(200)
      .send(`<h1>We have ${customerCount} customers on our Store</h1>`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Couldnt Get Users Count!");
  }
});

app.post("/api/create-customer", async (req, res) => {
  const { firstName, lastName, email, tags, note } = req.body;

  try {
    const session = shopify.session.customAppSession(
      process.env.SHOPIFY_STORE_URL
    );

    const customer = new shopify.rest.Customer({ session });
    customer.first_name = firstName;
    customer.last_name = lastName;
    customer.email = email;
    customer.tags = tags;
    customer.note = note;

    await customer.saveAndUpdate({
      update: true,
    });

    // Return the response with the customer data
    return res.status(200).json({ success: true, customer: customer });
  } catch (error) {
    console.error("Error creating customer:", error);
    return res.status(500).json({ error: "Failed to create customer." });
  }
});

app.listen(port, () => console.log("Server is running..."));

module.exports = app;
