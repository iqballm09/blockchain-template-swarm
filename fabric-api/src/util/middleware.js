import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tokenFilePath = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "wallet",
  "token.json"
);

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized, token is not provided" });
  }

  req.token = token;
  next();
}

export const checkTokenExpired = (req, res, next) => {
  let expiredIn = -1;

  // Get ID from token
  const id = req.token.split("-").pop();
  // Read file synchronously
  const data = fs.readFileSync(tokenFilePath, "utf-8");
  const jsonData = JSON.parse(data);

  // Search for matching token and set expiredIn if found
  jsonData.forEach((row) => {
    if (row["id"] === id && row["token"] === req.token) {
      expiredIn = row["expiredIn"];
    }
  });

  // Check if token is expired
  const timeNow = Math.floor(Date.now() / 1000);
  if (timeNow > expiredIn) {
    console.error("Token is expired, enroll again!");
    return res.status(400).json({ message: "Token is expired" });
  }
  next();
};
