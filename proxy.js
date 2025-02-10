const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors()); // Enable CORS

app.get("/coins", async (req, res) => {
  try {
    const response = await axios.get("http://localhost:8000/coins");
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

app.listen(4000, () => {
  console.log("Proxy running on http://localhost:4000");
});
