import { gql } from "apollo-angular";

export const CREATE_FARM = gql`
  mutation CreateFarm($input: CreateFarmInput!) {
    createFarm(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_FARM = gql`
  mutation UpdateFarm($id: ID!, $input: UpdateFarmInput!) {
    updateFarm(id: $id, input: $input) {
      success
      message
    }
  }
`;

export const DELETE_FARM = gql`
  mutation DeleteFarm($id: ID!) {
    deleteFarm(id: $id) {
      success
      message
    }
  }
`;