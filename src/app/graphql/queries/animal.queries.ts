import { gql } from 'apollo-angular';

export const CREATE_ANIMAL = gql`
  mutation CreateAnimal($input: CreateAnimalInput!) {
    createAnimal(input: $input) { 
      success
      message
    }
  }
`;

export const UPDATE_ANIMAL = gql`
  mutation UpdateAnimal($id: ID!, $input: UpdateAnimalInput!) {
    updateAnimal(id: $id, input: $input) { 
      success
      message
    }
  }
`;

export const DELETE_ANIMAL = gql`
  mutation DeleteAnimal($id: ID!) {
    deleteAnimal(id: $id) {
      success
      message
    }
  }
`;

export const ASSIGN_DEVICE = gql`
  mutation AssignDevice($animalId: ID!, $deviceId: ID) {
    assignDevice(animalId: $animalId, deviceId: $deviceId) {
      success
      message
    }
  }
`;

export const GET_DEVICES_PAGE_LIST = gql`
  query GetDevicesPageList($filter: EventFilterInput, $options: OptionsInput) {
    getDevices(filter: $filter, options: $options) {
      totalCount
      items {
        id
        deviceNo
        name
        createdAt
        animal {
          id
          tagNo
          name
        }
      }
    }
  }
`;

export const GET_UNASSIGNED_DEVICES = gql`
 query GetUnassignedDevices {
  getUnassignedDevices {
    items { 
      id
      deviceNo
      name
    }
    totalCount # Optional
  }
}
`;

export const ANIMALS = gql`
  query GetAnimals($filter: FilterInput, $options: OptionsInput) {
    getAnimals(filter: $filter, options: $options) {
      totalCount
      items {
        id
        name
        tagNo
        breed
        sex
        status
        ageInMonths
        createdAt
        updatedAt
        lactationStatus
        reproductionStatus
        farm {
          id
          name
          timezone
        }
        activeTag {
          id
          name
          deviceNo
          lastSeenAt
        }
        currentLactation {
          id
          lactationNumber
          startDate
          endDate
          status
          isActive
          daysInMilk
          daysOpen
          expectedDryoffDate
          expectedCalvingDate
          daysAgo
        }
        lastHeat {
          id
          occurredAt
          heatStrength
          isSilentHeat
          daysAgo
        }
        lastHealth {
          id
          occurredAt
          healthIndex
          daysAgo
        }
        lastInsemination {
          id
          occurredAt
          daysAgo
        }
        lastPregnancy {
          id
          occurredAt
          result
          daysPregnant
          daysAgo
        }
        lastCalving {
          id
          occurredAt
          daysAgo
        }
        lastDryoff {
          id
          occurredAt
          parity
          daysAgo
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const ANIMAL = gql`
  query getAnimal($animalId: ID!) {
    getAnimal(animalId: $animalId) {
      id
      name
      tagNo
      breed
      sex
      status
      ageInMonths
      createdAt
      updatedAt
      lactationStatus
      reproductionStatus
      farm {
        id
        name
      }
      activeTag {
        id
        name
        deviceNo
      }
      currentLactation {
        id
        lactationNumber
        startDate
        endDate
        status
        isActive
        daysInMilk
        daysOpen
        expectedDryoffDate
        expectedCalvingDate
        daysAgo
      }
      lastHeat {
        id
        occurredAt
        heatStrength

         inseminationWindow {
          startedAt
          endedAt
          optimalStartedAt
          optimalEndedAt
          optimalStartedAtSexed
          optimalEndedAtSexed
        }


        isSilentHeat
        note
        daysAgo
      }
      lastHealth {
        id
        occurredAt
        healthIndex
        treatmentType
        medicine
        nutrition
        prescriptionRef
        daysAgo
      }
      lastInsemination {
        id
        occurredAt
        process
        bullName
        inseminationNumber
        company
        breed
        type
        isSuccessful
        daysAgo
      }
      lastPregnancy {
        id
        occurredAt
        result
        daysPregnant
        expectedCalvingDate
        daysAgo
      }
      lastCalving {
        id
        occurredAt
        daysAgo
      }
      lastDryoff {
        id
        occurredAt
        parity
        daysAgo
      }
    }
  }
`;

export const ANIMAL_EVENTS = gql`
  query getAnimalEvents($filter: FilterInput, $options: OptionsInput) {
    getAnimalEvents(filter: $filter, options: $options) {
      totalCount
      items {
        __typename
        ... on Heat {
          id
          occurredAt
          heatStrength
          isSilentHeat
          startedAt
          endedAt
          note
          daysAgo
        }
        ... on Health {
          id
          occurredAt
          healthIndex
          treatmentType
          medicine
          nutrition
          prescriptionRef
          startedAt
          endedAt
          note
          daysAgo
        }
        ... on Insemination {
          id
          occurredAt
          process
          bullName
          inseminationNumber
          company
          breed
          type
          isSuccessful
          note
          daysAgo
        }
        ... on Pregnancy {
          id
          occurredAt
          result
          daysPregnant
          expectedCalvingDate
          note
          daysAgo
        }
        ... on Milking {
          id
          occurredAt
          morningMilk
          afternoonMilk
          eveningMilk
          totalMilk
          note
          daysAgo
        }
        ... on Calving {
          id
          occurredAt
          note
          daysAgo
        }
        ... on Dryoff {
          id
          occurredAt
          parity
          note
          daysAgo
        }
      }
    }
  }
`;

export const ANIMAL_CHART_DATASETS = gql`
  query getAnimalChartDatasets($filter: FilterInput) {
    getAnimalChartDatasets(filter: $filter) {
      id
      animalId
      tagId
      date
      timeIntervalUtc
      feeding
      ruminating
      standing
      resting
      other
    }
  }
`;



export const GET_ANIMAL = gql`
 query GetAnimal($animalId: ID!) {
    getAnimal(animalId: $animalId) {
      id
      name
      tagNo
      breed
      sex
      status
      lactationStatus
      reproductionStatus

      activeTag {
        id
        name
        deviceNo
      }

      currentLactation {
        daysAgo
        daysInMilk
        daysOpen
        expectedCalvingDate
        expectedDryoffDate
        lactationNumber        
        startDate
        endDate
      }    
      
      lastHeat {
        daysAgo
        heatStrength

         inseminationWindow {
          startedAt
          endedAt
          optimalStartedAt
          optimalEndedAt
          optimalStartedAtSexed
          optimalEndedAtSexed
        }

        occurredAt
        startedAt
        endedAt
      }  
      
      lastHealth {
        daysAgo
        healthIndex
        occurredAt

         healthIndexTrendData {
          timestamp
          value
        }

        symptoms
        abnormalBehaviors
        recoveredAbnormalBehaviors

        startedAt
        endedAt        
      }

      lastInsemination {
        daysAgo
        occurredAt
      }

      lastPregnancy {
        daysAgo
        result
        occurredAt
        daysPregnant
        expectedCalvingDate
      }

      lastCalving {
        daysAgo        
        occurredAt
      }

      lastDryoff {
        daysAgo
        occurredAt
      }
      
    }
  }
`;

export const GET_ANIMAL_EVENTS = gql`
  query GetAnimalEvents($filter: FilterInput, $options: OptionsInput) {
    getAnimalEvents(filter: $filter, options: $options) {
      items {
        __typename
        ... on CommonEvent {
          id
          occurredAt
          daysAgo
          isActive
          note
        }
        ... on Heat {
          heatStrength
           occurredAt
          daysAgo
          isActive
          note
        }
        ... on Health {
          healthIndex
           healthIndexTrendData {
          timestamp
          value
        }
          occurredAt
          daysAgo
          isActive
          note
        }
      }
      totalCount
    }
  }
`;

export const GET_ANIMAL_CHART_DATASETS = gql`
  query GetAnimalChartDatasets($deviceNo: String!, $fromTime: String!, $toTime: String!, $timeBucket: String!) {
    getAnimalChartDatasets(deviceNo: $deviceNo, fromTime: $fromTime, toTime: $toTime, timeBucket: $timeBucket) {
    timestamp
    feeding
    ruminating
    standing
    resting
    other
    heatStrength
    healthIndex
    }
  }
`;
