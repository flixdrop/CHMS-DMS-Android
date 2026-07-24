import { gql } from 'apollo-angular';

export const GET_DEVICES = gql`
  query GetDevices($filter: FilterInput!, $options: OptionsInput) {
    getDevices(filter: $filter, options: $options) {
      totalCount
      items {
         id
        deviceNo
        name
        manufacturer
         animal {
          id
          tagNo
          name
          breed

           activeTag {
          id
          name
          deviceNo
          lastSeenAt
        }

        }
        type
        lastSeenAt
        online
        state
        batteryRemaining
        ambientTemperature
        rssi
        createdAt
        updatedAt
      }
    }
  }
`;

export const CREATE_DEVICE = gql`
  mutation CreateDevice($input: CreateDeviceInput!) {
    createDevice(input: $input) {
      success
      message
      device { id deviceNo }
    }
  }
`;

export const UPDATE_DEVICE = gql`
  mutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {
    updateDevice(id: $id, input: $input) {
      success
      message
    }
  }
`;

export const DELETE_DEVICE = gql`
  mutation DeleteDevice($id: ID!) {
    deleteDevice(id: $id) {
      success
      message
    }
  }
`;

export const GET_UNASSIGNED_ANIMALS = gql`
  query GetUnassignedAnimals {
    getUnassignedAnimals {
      items {
        id
        tagNo
        name
        breed
      }
    }
  }
`;