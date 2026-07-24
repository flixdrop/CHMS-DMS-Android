// import { gql } from "apollo-angular";

// export const CREATE_USER = gql`
//   mutation CreateUser($input: CreateUserInput!) {
//     createUser(input: $input) {
//       id
//       name
//       username
//       accessLevel
//       accountTier
//       path
//       businessProfile {
//         logo
//       }
//     }
//   }
// `;

// export const UPDATE_USER = gql`
//   mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
//     updateUser(id: $id, input: $input) {
//       success
//       message
//     }
//   }
// `;

// export const DELETE_USER_MUTATION = gql`
//   mutation DeleteUser($id: ID!) {
//     deleteUser(id: $id) {
//       success
//       message
//     }
//   }
// `;

// export const FORGOT_PASSWORD = gql`
//   mutation ForgotPassword($identifier: String!) {
//     forgotPassword(identifier: $identifier) {
//       success
//       message
//     }
//   }
// `;

// export const RESET_PASSWORD = gql`
//   mutation ResetPassword($token: String!, $newPassword: String!) {
//     resetPassword(token: $token, newPassword: $newPassword) {
//       success
//       message
//     }
//   }
// `;

// export const SIGN_IN = gql`
//   mutation SignIn($identifier: String!, $password: String!, $deviceToken: String) {
//     signIn(identifier: $identifier, password: $password, deviceToken: $deviceToken) {
//       id
//       name
//       username
//       email
//       logo
//       token
//       refreshToken
//       accessLevel
//       accountTier
//       path
//       tokenExpiration
//       message
//     }
//   }
// `;

// export const SIGN_OUT = gql`
//   mutation SignOut($userId: ID, $deviceToken: String) {
//     signOut(userId: $userId, deviceToken: $deviceToken) {
//       success
//       message
//     }
//   }
// `;


// export const REFRESH_ACCESS_TOKEN = gql`
//   mutation RefreshAccessToken($refreshToken: String!) {
//     refreshAccessToken(refreshToken: $refreshToken) {
//       id
//       name
//       username
//       email
//       token
//       refreshToken
//       accessLevel
//       accountTier
//       path
//       tokenExpiration
//       message
//     }
//   }
// `;

// export const REGISTER_FCM_TOKEN = gql`
//   mutation RegisterFcmToken($deviceToken: String!) {
//     registerFcmToken(deviceToken: $deviceToken) {
//       success
//       message
//     }
//   }
// `;




import { gql } from "apollo-angular";

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      username
      accessLevel
      accountTier
      path
      businessProfile {
        logo
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      success
      message
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      message
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($identifier: String!) {
    forgotPassword(identifier: $identifier) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      success
      message
    }
  }
`;

// 🟢 UPDATED: Added optional $deviceInfo parameter
export const SIGN_IN = gql`
  mutation SignIn(
    $identifier: String!
    $password: String!
    $deviceToken: String
    $deviceInfo: DeviceInfoInput
  ) {
    signIn(
      identifier: $identifier
      password: $password
      deviceToken: $deviceToken
      deviceInfo: $deviceInfo
    ) {
      id
      name
      username
      email
      logo
      token
      refreshToken
      accessLevel
      accountTier
      path
      tokenExpiration
      message
    }
  }
`;

export const SIGN_OUT = gql`
  mutation SignOut($userId: ID, $deviceToken: String) {
    signOut(userId: $userId, deviceToken: $deviceToken) {
      success
      message
    }
  }
`;

export const REFRESH_ACCESS_TOKEN = gql`
  mutation RefreshAccessToken($refreshToken: String!, $deviceInfo: DeviceInfoInput) {
    refreshAccessToken(refreshToken: $refreshToken, deviceInfo: $deviceInfo) {
      id
      name
      username
      email
      token
      refreshToken
      accessLevel
      accountTier
      path
      tokenExpiration
      message
    }
  }
`;

// 🟢 UPDATED: Added optional $deviceInfo parameter
export const REGISTER_FCM_TOKEN = gql`
  mutation RegisterFcmToken($deviceToken: String!, $deviceInfo: DeviceInfoInput) {
    registerFcmToken(deviceToken: $deviceToken, deviceInfo: $deviceInfo) {
      success
      message
    }
  }
`;