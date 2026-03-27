import { gql } from "apollo-angular";

export const GET_DASHBOARD_ITEMS = gql`
  query GetDashboardCounts($userId: ID!) {
        getDashboardCounts(userId: $userId) {
          totalAnimals
          totalHeats
          totalHealths
          totalRecoveries
          totalInseminations
          totalPregnancies
          totalCalvings
          totalDryoffEvents
        }
      }
`;

export const GET_ANIMALS = gql`
query GetAnimals($getListInputType: GetListInputType) {
  getAnimals(getListInputType: $getListInputType) {
      totalCount
      items {
         id
          name 
          collar{
            id
            collarId
            name
          }     
          farm{
            name
            organization{
              user{
                username
                phoneNumber
              }
              parentOrganization{
                name
              }
            }
          }
          createdAt
          updatedAt      
      }
    }
  }
`;

export const GET_HEATS = gql`
query GetHeats($userId: String!, $limit: Int, $offset: Int, $search: String, $startDate: String, $endDate: String) {
  getHeats(userId: $userId, limit: $limit, offset: $offset, search: $search, startDate: $startDate, endDate: $endDate) {
    totalCount
    items {
      id
          animal{
            id
            name
            collar{
              collarId
              name
            }
              farm{
                name
                organization{
                  user{
                    username
                    phoneNumber
                  }
                  parentOrganization{
                    name
                  }
                }
              }
            }
          heatStrength
          startedAt
          endedAt
          detectedAt
          isActive
          createdAt
          updatedAt
    }
  }
}
`;

export const GET_HEALTHS = gql`
query GetHealths($userId: String!, $limit: Int, $offset: Int, $search: String, $startDate: String, $endDate: String) {
  getHealths(userId: $userId, limit: $limit, offset: $offset, search: $search, startDate: $startDate, endDate: $endDate) {
    totalCount
    items {
      id
          animal{
            id
            name
            collar{
              collarId
              name
            }
              farm{
                name
                organization{
                  user{
                    username
                    phoneNumber
                  }
                  parentOrganization{
                    name
                  }
                }
              }
            }
            treatmentDetails {
        medicine
        nutrition
        treatmentType
        prescriptionRef
      }
          healthIndex
          startedAt
          endedAt
          detectedAt
          isActive
          createdAt
          updatedAt
    }
  }
}
`;

export const GET_RECOVERIES = gql`
query GetRecoveries($userId: String!, $limit: Int, $offset: Int, $search: String, $startDate: String, $endDate: String) {
  getRecoveries(userId: $userId, limit: $limit, offset: $offset, search: $search, startDate: $startDate, endDate: $endDate) {
    totalCount
    items {
      id
          animal{
            id
            name
            collar{
              collarId
              name
            }
              farm{
                name
                organization{
                  user{
                    username
                    phoneNumber
                  }
                  parentOrganization{
                    name
                  }
                }
              }
            }
            treatmentDetails {
        medicine
        nutrition
        treatmentType
        prescriptionRef
      }
          healthIndex
          startedAt
          endedAt
          detectedAt
          isActive
          createdAt
          updatedAt
    }
  }
}
`;

export const GET_INSEMINATIONS = gql`
  query GetInseminations($userId: String!, $limit: Int, $offset: Int, $search: String, $startDate: String, $endDate: String) {
  getInseminations(userId: $userId, limit: $limit, offset: $offset, search: $search, startDate: $startDate, endDate: $endDate) {
    totalCount
    items {
       id
          animal{
            id
            name
            collar{
              collarId
              name
            }
              farm{
                name
                organization{
                  user{
                    username
                    phoneNumber
                  }
                  parentOrganization{
                    name
                  }
                }
              }
            }
          eventDateTime
          isActive
    }
  }
}
`;

export const GET_PREGNANCIES = gql`
  query GetPregnancies($userId: String!, $limit: Int, $offset: Int, $search: String, $startDate: String, $endDate: String) {
  getPregnancies(userId: $userId, limit: $limit, offset: $offset, search: $search, startDate: $startDate, endDate: $endDate) {
    totalCount
    items {
        id
          animal{
            id
            name
            collar{
              collarId
              name
            }
              farm{
                name
                organization{
                  user{
                    username
                    phoneNumber
                  }
                  parentOrganization{
                    name
                  }
                }
              }
            }
          result
          eventDateTime
          isActive
    }
  }
}
`;

export const GET_CALVINGS = gql`
  query GetCalvings($userId: String!, $limit: Int, $offset: Int, $search: String, $startDate: String, $endDate: String) {
  getCalvings(userId: $userId, limit: $limit, offset: $offset, search: $search, startDate: $startDate, endDate: $endDate) {
    totalCount
    items {
      id
          animal{
            id
            name
            collar{
              collarId
              name
            }
              farm{
                name
                organization{
                  user{
                    username
                    phoneNumber
                  }
                  parentOrganization{
                    name
                  }
                }
              }
            }
          eventDateTime
          isActive
    }
  }
}
`;

export const GET_DRYOFF_EVENTS = gql`
  query GetDryoffEvents($userId: String!, $limit: Int, $offset: Int, $search: String, $startDate: String, $endDate: String) {
  getDryoffEvents(userId: $userId, limit: $limit, offset: $offset, search: $search, startDate: $startDate, endDate: $endDate) {
    totalCount
    items {
      id
          animal{
            id
            name
            collar{
              collarId
              name
            }
              farm{
                name
                organization{
                  user{
                    username
                    phoneNumber
                  }
                  parentOrganization{
                    name
                  }
                }
              }
            }
          eventDateTime
          isActive
    }
  }
}
`;

export const GET_MILK_ENTRIES = gql`
  query GetMilkEntries($userId: String!, $limit: Int, $offset: Int, $search: String, $startDate: String, $endDate: String) {
  getMilkEntries(userId: $userId, limit: $limit, offset: $offset, search: $search, startDate: $startDate, endDate: $endDate) {
    totalCount
    items {
     id
          animal{
            id
            name
            collar{
              collarId
              name
            }
              farm{
                name
                organization{
                  user{
                    username
                    phoneNumber
                  }
                  parentOrganization{
                    name
                  }
                }
              }
            }
          totalMilk
          eventDateTime
          createdAt
    }
  }
}
`;

export const GET_ALL_EVENTS = gql`
  query GetAllEvents($userId: String!, $limit: Int, $offset: Int, $search: String, $startDate: String, $endDate: String) {
    getAllEvents(userId: $userId, limit: $limit, offset: $offset, search: $search, startDate: $startDate, endDate: $endDate) {
      totalCount
      items {
        id
        eventType
        eventDate
        isActive
        notes
        heatStrength
        treatmentDetails {
          medicine
          nutrition
          treatmentType
          prescriptionRef
        }
        healthIndex
        process
        result
        parity
        animal {
          id
          name
          collar {
            collarId
            name
          }
          farm {
            name
            organization {
              user {
                username
                phoneNumber
              }
              parentOrganization {
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_ANIMAL_DETAILS = gql`
  query GetAnimalDetails($animalId: String!, $startDate: String!, $endDate: String!) {
    getAnimalDetails(animalId: $animalId, startDate: $startDate, endDate: $endDate) {
      animal {
        id
        name
        tagNo
        breed
        collar { name }
         farm{
            name
            organization{
              user{
                username
                phoneNumber
              }
              parentOrganization{
                name
              }
            }
          }
      }
      activities {
        date
        timeIntervalUtc
        feeding
        ruminating
        resting
        standing
        other
      }
      allEvents {
        id
        eventType
        eventDate
        notes
        healthIndex
         treatmentDetails {
        medicine
        nutrition
        treatmentType
        prescriptionRef
      }
        heatStrength
        result
        morningMilk
        afternoonMilk
        eveningMilk
        totalMilk
      }
      lastHeat { detectedAt heatStrength }
      lastHealth { detectedAt healthIndex }
      lastInsemination { eventDateTime }
    }
  }
`;

export const GET_GRAPH_DATA = gql`
      query GetActivityData($animalId: String!, $startDate: String!, $endDate: String!) {
        getActivitiesByAnimal(animalId: $animalId, startDate: $startDate, endDate: $endDate) {
          feeding, date, other, resting, ruminating, standing, timeIntervalUtc
        }
      }
    `;