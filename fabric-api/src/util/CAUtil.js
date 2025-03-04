/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

import { generateToken } from "./AppUtil.js";

/**
 *
 * @param {*} FabricCAServices
 * @param {*} ccp
 */

export const expiredAdminToken = "5m";
export const expiredUserToken = "5m";

export const buildCAClient = (FabricCAServices, ccp, caHostName) => {
  // Create a new CA client for interacting with the CA.
  const caInfo = ccp.certificateAuthorities[caHostName]; //lookup CA details from config
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  const caClient = new FabricCAServices(
    caInfo.url,
    { trustedRoots: caTLSCACerts, verify: false },
    caInfo.caName
  );

  console.log(`Built a CA Client named ${caInfo.caName}`);
  return caClient;
};

export const enrollAdmin = async (
  caClient,
  wallet,
  adminUserId,
  adminUserPasswd,
  orgMspId
) => {
  try {
    // Generate token
    const token = generateToken(adminUserId);

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await caClient.enroll({
      enrollmentID: adminUserId,
      enrollmentSecret: adminUserPasswd,
    });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: orgMspId,
      type: "X.509",
    };
    await wallet.put(adminUserId, x509Identity);
    return token;
  } catch (error) {
    console.error(`Failed to enroll admin user : ${error}`);
  }
};

export const registerUser = async (
  caClient,
  wallet,
  adminUserId,
  userId,
  affiliation
) => {
  try {
    // Must use an admin to register a new user
    const adminIdentity = await wallet.get(adminUserId);
    if (!adminIdentity) {
      console.error("Enroll the admin user!");
      return;
    }
    // build a user object for authenticating with the CA
    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

    // Register the user, enroll the user, and import the new identity into the wallet.
    // if affiliation is specified by client, the affiliation value must be configured in CA
    const secret = await caClient.register(
      {
        affiliation: affiliation,
        enrollmentID: userId,
        role: "client",
      },
      adminUser
    );
    return secret;
  } catch (error) {
    console.error(`Failed to register user : ${error}`);
  }
};

export const enrollUser = async (
  caClient,
  wallet,
  userId,
  userPasswd,
  orgMspId
) => {
  try {
    // Enroll the user, and import the new identity into the wallet.
    const userExist = await wallet.get(userId)
    if (userExist) {
      return generateToken(userId)
    }
    const enrollment = await caClient.enroll({
      enrollmentID: userId,
      enrollmentSecret: userPasswd,
    });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: orgMspId,
      type: "X.509",
    };
    await wallet.put(userId, x509Identity);
    return generateToken(userId);
  } catch (error) {
    console.error(`Failed to enroll user : ${error}`);
  }
};
