import { gql } from "apollo-angular";

export const SIGN_IN = gql`
  mutation SignIn($identifier: String!, $password: String!) {
    signIn(identifier: $identifier, password: $password) {
      id
      username
      email
      token
      tokenExpiration
      role
      message
    }
  }
`;

// Logout Mutation
export const SIGN_OUT = gql`
  mutation SignOut($userId: String!, $deviceToken: String!) {
    signOut(userId: $userId, deviceToken: $deviceToken) {
      userId
      deviceToken
      message
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($identifier: String!) {
    forgotPassword(identifier: $identifier)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;