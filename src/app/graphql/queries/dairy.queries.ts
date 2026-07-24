
import { gql } from 'apollo-angular';

export const GET_MILKING_LOGS = gql`
  query GetMilkingLogs($filter: FilterInput, $options: OptionsInput) {
    getMilkingLogs(filter: $filter, options: $options) {
      items {
        id
        isActive
        morningMilk
        afternoonMilk
        eveningMilk
        totalMilk
        occurredAt
        note
        daysAgo
        animal {
          id
          tagNo
          breed
          activeTag{
          deviceNo}
        }
      }
      totalCount
    }
  }
`;

export const CREATE_MILK_ENTRY = gql`
  mutation CreateMilkEntry($input: CreateMilkEntryInput!) {
    createMilkEntry(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_MILK_ENTRY = gql`
  mutation UpdateMilkEntry($input: UpdateMilkEntryInput!) {
    updateMilkEntry(input: $input) {
      success
      message
    }
  }
`;

export const DELETE_MILK_ENTRY = gql`
  mutation DeleteMilkEntry($milkEntryId: ID!) {
    deleteMilkEntry(milkEntryId: $milkEntryId) {
      success
      message
    }
  }
`;

export const CREATE_DRYOFF = gql`
  mutation CreateDryoff($input: CreateDryoffInput!) {
    createDryoff(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_DRYOFF = gql`
  mutation UpdateDryoff($input: UpdateDryoffInput!) {
    updateDryoff(input: $input) {
      success
      message
    }
  }
`;

export const DELETE_DRYOFF = gql`
  mutation DeleteDryoff($dryoffId: ID!) {
    deleteDryoff(dryoffId: $dryoffId) {
      success
      message
    }
  }
`;