import express from "express";

import { expiredAdminToken, expiredUserToken } from "./util/CAUtil.js";
import { enrollAdminOrg1 } from "./enrollAdmin.js";
import { registerUserOrg1 } from "./registerUser.js";
import { authenticateToken, checkTokenExpired } from "./util/middleware.js";
import { getUserTokenData } from "./util/AppUtil.js";
import { enrollUserOrg1 } from "./enrollUser.js";
import dotenv from "dotenv";
import {
  addTransaction,
  queryAllTransactions,
  queryTransaction,
} from "./transaction.js";

dotenv.config();

// Define consts
const API_URL = process.env.API_URL;
const API_PORT = process.env.API_PORT;

// Create express.js app
const app = express();
const router = express.Router();

// Middleware
app.use(express.json());

// Endpoint enroll admin
app.get("/ca/enroll/admin", async (req, res) => {
  const id = req.body.id;
  const secret = req.body.secret;
  if (!id || !secret) {
    return res.status(400).json({ error: "Id and secret are required" });
  }

  const token = await enrollAdminOrg1(id, secret);
  return res.status(200).json({
    message: `Successfully enroll ${id}`,
    token: token,
    expiresIn: expiredAdminToken,
  });
});

// Endpoint register user
app.post(
  "/ca/register/user",
  authenticateToken,
  checkTokenExpired,
  async (req, res) => {
    const id = req.body.id;

    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }
    const secret = await registerUserOrg1(id, req.token);
    return res.status(201).json({
      message: `Successfully register ${id}`,
      secret: secret,
    });
  }
);

// Endpoint get user secret
app.get(
  "/ca/register/user",
  authenticateToken,
  checkTokenExpired,
  async (req, res) => {
    const id = req.body.id;

    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    // search user data
    const searchData = getUserTokenData(id);

    if (!Object.keys(searchData).length) {
      return res.status(404).json({ error: `User ${id} is not found` });
    }
    return res.status(200).json({
      message: `Successfully get ${id} secret`,
      secret: searchData["secret"],
    });
  }
);

// Endpoint enroll user
app.get("/ca/enroll/user", async (req, res) => {
  const id = req.body.id;
  const secret = req.body.secret;
  if (!id || !secret) {
    return res.status(400).json({ error: "Id and secret are required" });
  }

  const token = await enrollUserOrg1(id, secret);
  return res.status(200).json({
    message: `Successfully enroll ${id}`,
    token: token,
    expiresIn: expiredUserToken,
  });
});

// Endpoint for add transaction
app.post(
  "/chaincode/invoke/transaction",
  authenticateToken,
  checkTokenExpired,
  async (req, res) => {
    const data = JSON.stringify(req.body.data);
    const output = await addTransaction(data);
    if (output.status != 201) {
      return res.status(400).json({ error: output.error });
    }
    return res.status(201).json(output.data);
  }
);

// Endpoint for get all transactions
app.get(
  "/chaincode/query/transaction/all",
  authenticateToken,
  checkTokenExpired,
  async (req, res) => {
    const { stdout, stderr } = await queryAllTransactions();
    if (stderr) {
      return res.status(400).json({ error: stderr });
    }
    return res.status(200).json(JSON.parse(stdout));
  }
);

// Endpoint for get transaction
app.get(
  "/chaincode/query/transaction",
  authenticateToken,
  checkTokenExpired,
  async (req, res) => {
    const keySearch = req.body.key;
    const { stdout, stderr } = await queryTransaction(keySearch);
    if (stderr) {
      return res.status(400).json({ error: stderr });
    }
    return res.status(200).json(JSON.parse(stdout));
  }
);

// Endpoint for another smart contract function

// Start the server
app.listen(API_PORT, () => {
  console.log(`Server is running on ${API_URL}`);
});
