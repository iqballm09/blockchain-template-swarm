/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

import { Wallets } from "fabric-network";
import FabricCAServices from "fabric-ca-client";
import path from "path";
import { buildCAClient, registerUser } from "./util/CAUtil.js";
import {
  buildCCPOrg1,
  buildCCPOrg2,
  buildWallet,
  updateFileToken,
} from "./util/AppUtil.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mspOrg1 = process.env.ORG1_MSPNAME;
const mspOrg2 = process.env.ORG2_MSPNAME;
const caOrg1Domain = process.env.CA_ORG1_DOMAIN;
const caOrg2Domain = process.env.CA_ORG2_DOMAIN;
const peer0Org1Affl = process.env.PEER0_ORG1_CA_AFFILIATION;
const peer0Org2Affl = process.env.PEER0_ORG2_CA_AFFILIATION;

export async function registerUserOrg1(userId, tokenAdmin) {
  console.log("\n--> Registering the Org1 CA user");
  // get admin id from token admin
  const adminId = tokenAdmin.split("-").pop();

  const ccpOrg1 = buildCCPOrg1();
  const caOrg1Client = buildCAClient(FabricCAServices, ccpOrg1, caOrg1Domain);
  const walletPathOrg1 = path.join(__dirname, "..", "..", "wallet/org1");
  const walletOrg1 = await buildWallet(Wallets, walletPathOrg1);

  const secret = await registerUser(
    caOrg1Client,
    walletOrg1,
    adminId,
    userId,
    peer0Org1Affl
  );
  // save user info
  updateFileToken({
    id: userId,
    secret: secret,
    mspId: mspOrg1,
    token: "",
    expiredIn: -1,
  });
  return secret;
}

export async function registerUserOrg2(userId, tokenAdmin) {
  console.log("\n--> Registering the Org2 CA user");
  // get admin id from token admin
  const adminId = tokenAdmin.split("-").pop();

  const ccpOrg2 = buildCCPOrg2();
  const caOrg2Client = buildCAClient(FabricCAServices, ccpOrg2, caOrg2Domain);
  const walletPathOrg2 = path.join(__dirname, "..", "..", "wallet/org2");
  const walletOrg2 = await buildWallet(Wallets, walletPathOrg2);

  const secret = await registerUser(
    caOrg2Client,
    walletOrg2,
    adminId,
    userId,
    peer0Org2Affl
  );

  // save user info
  updateFileToken({
    id: userId,
    secret: secret,
    mspId: mspOrg2,
    token: "",
    expiredIn: -1,
  });

  return secret;
}
