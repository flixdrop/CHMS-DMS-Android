
import { gql } from "apollo-angular";

export const ACCOUNT_HOLDERS_LIST = gql`
  query GetAccountHolders($targetTier: Int) {
    getAccountHolders(targetTier: $targetTier) {
      id
      username
      path
    }
  }
`;

export const MANAGED_USERS_LIST = gql`
  query GetManagedUsers($parentPath: String!) {
    getManagedUsers(parentPath: $parentPath) {
      id
      username
      path
      accessLevel
    }
  }
`;

export const MANAGED_FARMS_LIST = gql`
  query GetManagedFarms($targetPath: String!) {
    getManagedFarms(targetPath: $targetPath) {
      id
      name
      ownerPath
      legalType
    }
  }
`;