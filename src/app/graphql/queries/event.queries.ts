import { gql } from 'apollo-angular';

export const GET_HEATS = gql`
  query GetHeats($filter: FilterInput!, $options: OptionsInput) {
    getHeats(filter: $filter, options: $options) {
      totalCount
      items {
        id
        heatStrength   
        occurredAt
        startedAt
        endedAt
        isActive
        daysAgo      
        isSilentHeat   
        ongoing
        
        animal {
          id
          name
          tagNo
          activeTag {
            id
            deviceNo
          }
        }

        inseminationWindow {
          startedAt
          endedAt
          optimalStartedAt
          optimalEndedAt
          optimalStartedAtSexed
          optimalEndedAtSexed
        }

        reproductiveProfile {
          heatReviewStatus
          lastIssue
          lastIssueStartedAt
          lastIssueEndedAt
          heatCountInCurrentLactation
          anestrousProbability
          pregnancyLossProbability
        }
      }
    }
  }
`;

export const GET_HEALTHS = gql`
  query GetHealths($filter: FilterInput!, $options: OptionsInput) {
    getHealths(filter: $filter, options: $options) {
      totalCount
      items {
        id
        isActive
        ongoing              
        occurredAt
        startedAt
        endedAt
        note
        daysAgo
        source
        veterinarianName

        animal {
          id
          name
          tagNo
          activeTag {
            id
            deviceNo
          }
        }

        healthIndex
        minHealthIndex
        healthIndexTrend
        duration

        healthIndexTrendData {
          timestamp
          value
        }

        symptoms
        abnormalBehaviors
        recoveredAbnormalBehaviors

        eventType
        severity
        status
        resolutionStatus

        vitals {
          temperature
          ruminationTime
          weightAtEvent
        }

        withdrawal {
          milkWithdrawalUntil
          meatWithdrawalUntil
          isWithdrawn
        }

        followUp {
          requiresFollowUp
          scheduledAt
          actionRequired
        }

        medicine
        nutrition
        treatmentType
        prescriptionRef

        treatmentDetails {
          treatmentType
          medicine
          dosage
          routeOfAdmin
          nutrition
          prescriptionRef
          note
        }
      }
    }
  }
`;

export const GET_RECOVERIES = gql`
  query GetRecoveries($filter: FilterInput!, $options: OptionsInput) {
    getRecoveries(filter: $filter, options: $options) {
       totalCount
      items {
        id
        isActive
        ongoing              
        occurredAt
        startedAt
        endedAt
        note
        daysAgo
        source
        veterinarianName

        animal {
          id
          name
          tagNo
          activeTag {
            id
            deviceNo
          }
        }

        healthIndex
        minHealthIndex
        healthIndexTrend
        duration

        healthIndexTrendData {
          timestamp
          value
        }

        symptoms
        abnormalBehaviors
        recoveredAbnormalBehaviors

        eventType
        severity
        status
        resolutionStatus

        vitals {
          temperature
          ruminationTime
          weightAtEvent
        }

        withdrawal {
          milkWithdrawalUntil
          meatWithdrawalUntil
          isWithdrawn
        }

        followUp {
          requiresFollowUp
          scheduledAt
          actionRequired
        }

        medicine
        nutrition
        treatmentType
        prescriptionRef

        treatmentDetails {
          treatmentType
          medicine
          dosage
          routeOfAdmin
          nutrition
          prescriptionRef
          note
        }
      }
    }
  }
`;

export const GET_INSEMINATIONS = gql`
  query GetInseminations($filter: FilterInput!, $options: OptionsInput) {
    getInseminations(filter: $filter, options: $options) {
      totalCount
         items {
        id
       animal {
          id
          name
          tagNo
          activeTag {
            id
            deviceNo
          }
        }

breed
bullName
company
daysAgo
inseminationNumber
inseminator {
  name
  contact  
}
isActive
isSuccessful
lactationId
process
semenDetails {
  batchNumber
  breed
  company
  type
}
        occurredAt
        isActive
      }
    }
  }
`;

export const GET_PREGNANCIES = gql`
  query GetPregnancies($filter: FilterInput!, $options: OptionsInput) {
    getPregnancies(filter: $filter, options: $options) {
      totalCount
      items {
        id
        animal {
          id
          name
          tagNo
          activeTag {
            id
            deviceNo
          }
        }
        performedBy{
        name
        username
        email
        contact
        }
        daysPregnant
        expectedCalvingDate
        result
        occurredAt
        isActive
      }
    }
  }
`;

export const GET_CALVINGS = gql`
  query GetCalvings($filter: FilterInput!, $options: OptionsInput) {
    getCalvings(filter: $filter, options: $options) {
      totalCount
      items {
        id
        animal {
          id
          name
          tagNo
          activeTag {
            id
            deviceNo
            }
            }
            lactationId
            occurredAt
            isActive
      }
    }
  }
`;

export const GET_DRYOFFS = gql`
  query GetDryoffs($filter: FilterInput!, $options: OptionsInput) {
    getDryoffs(filter: $filter, options: $options) {
      totalCount
      items {
        id
        animal {
          id
          name
          tagNo

          currentLactation{
            lactationNumber
            startDate
            endDate
            status
            isActive
            daysInMilk
            daysOpen
            voluntaryWaitPeriodDate
            expectedDryoffDate
            expectedCalvingDate
          }


          activeTag {
            id
            deviceNo
          }
        }

        reason
        occurredAt
        isActive
      }
    }
  }
`;

export const GET_LACTATIONS = gql`
  query GetLactations($filter: FilterInput!, $options: OptionsInput) {
    getLactations(filter: $filter, options: $options) {
      items {
        id
        lactationNumber
        status
        daysInMilk
        daysOpen
        startDate             # <-- Corrected: Use this instead of occurredAt
        endDate               # <-- Corrected: Use this instead of actualEndDate
        voluntaryWaitPeriodDate
        expectedDryoffDate
        expectedCalvingDate
        createdAt
        updatedAt
        animal {
          id
          tagNo
          name
          activeTag {
            id
            deviceNo
          }
        }
        
        # Timeline union elements handle occurredAt safely inside their own types
        milestones {
          __typename
          ... on Heat {
            id
            occurredAt
            heatStrength
            isSilentHeat
            note
          }
          ... on Insemination {
            id
            occurredAt
            process
            bullName
            inseminationNumber
            isSuccessful
            note
          }
          ... on Pregnancy {
            id
            occurredAt
            result
            daysPregnant
            expectedCalvingDate
            note
          }
          ... on Health {
            id
            occurredAt
            healthIndex
            treatmentType
            medicine
            note
          }
          ... on Milking {
            id
            occurredAt
            totalMilk
          }
          ... on Calving {
            id
            occurredAt
          }
          ... on Dryoff {
            id
            occurredAt
            parity
          }
        }
      }
      totalCount
    }
  }
`;

export const GET_REPRODUCTIONS = gql`
  query GetReproductions($filter: FilterInput!, $options: OptionsInput) {
    getReproductions(filter: $filter, options: $options) {
      items {
        id
        status
        startedAt             # <-- Corrected: Match root type spec
        firstInseminationDate
        lastInseminationDate
        conceptionDate
        inseminationCount
        isActive
        createdAt
        updatedAt
        
        animal {
          id
          tagNo
          name
          activeTag {
            id
            deviceNo
          }
        }
        
        lactation {
          id
          lactationNumber
          status
          daysInMilk
          startDate
        }
        
        milestones {
          __typename
          ... on Heat {
            id
            occurredAt
            heatStrength
            note
          }
          ... on Insemination {
            id
            occurredAt
            process
            bullName
            inseminationNumber
            isSuccessful
            semenDetails {
              type
              company
              breed
              batchNumber
            }
          }
          ... on Pregnancy {
            id
            occurredAt
            result
            daysPregnant
            expectedCalvingDate
            note
          }
          ... on Calving {
            id
            occurredAt
          }
          ... on Dryoff {
            id
            occurredAt
          }
        }
      }
      totalCount
    }
  }
`;

export const GET_ACTIVE_CYCLES = gql`
  query GetActiveCycles($filter: FilterInput!, $options: OptionsInput) {
    getActiveCycles(filter: $filter, options: $options) {
      items {
        id
        lactationNumber
        startDate
        status
        daysInMilk
        animal {
          id
          tagNo
          name
          breed
        }
      }
      totalCount
    }
  }
`;

export const CREATE_HEAT = gql`
  mutation CreateHeat($animalId: ID!, $heatStrength: String!, $occurredAt: String, $isSilent: Boolean) {
    createHeat(animalId: $animalId, heatStrength: $heatStrength, occurredAt: $occurredAt, isSilent: $isSilent) {
      id
      heatStrength
      isSilentHeat
      occurredAt
      note
    }
  }
`;

export const UPDATE_HEAT = gql`
  mutation UpdateHeat($heatId: ID!, $heatStrength: String, $isSilentHeat: Boolean, $occurredAt: String, $note: String) {
    updateHeat(heatId: $heatId, heatStrength: $heatStrength, isSilentHeat: $isSilentHeat, occurredAt: $occurredAt, note: $note) {
      id
      heatStrength
      isSilentHeat
      occurredAt
      note
    }
  }
`;

export const DELETE_HEAT = gql`
  mutation DeleteHeat($heatId: ID!) {
    deleteHeat(heatId: $heatId) {
      success
      message
    }
  }
`;

export const RESOLVE_HEAT_SELECTION = gql`
  mutation ResolveHeatSelection(
    $heatId: ID!
    $inseminationInput: InseminationInput
    $cancellationInput: CancellationInput
  ) {
    resolveHeatSelection(
      heatId: $heatId
      inseminationInput: $inseminationInput
      cancellationInput: $cancellationInput
    ) {
      success
      message
    }
  }
`;

export const RESOLVE_PREGNANCY_SELECTION = gql`
  mutation ResolvePregnancySelection(
    $pregnancyId: ID!
    $hasCalved: Boolean!
    $resolutionInput: PregnancyResolutionInput
  ) {
    resolvePregnancySelection(
      pregnancyId: $pregnancyId
      hasCalved: $hasCalved
      resolutionInput: $resolutionInput
    ) {
      success
      message
    }
  }
`;

export const CREATE_CALVING = gql`
  mutation CreateCalving($animalId: ID!, $occurredAt: String!, $note: String) {
    createCalving(animalId: $animalId, occurredAt: $occurredAt, note: $note) {
      success
      message
    }
  }
`;

export const UPDATE_CALVING = gql`
  mutation UpdateCalving($calvingId: ID!, $input: CalvingUpdateInput!) {
    updateCalving(calvingId: $calvingId, input: $input) {
      success
      message
    }
  }
`;

export const DELETE_CALVING = gql`
  mutation DeleteCalving($calvingId: ID!) {
    deleteCalving(calvingId: $calvingId) {
      success
      message
    }
  }
`;

export const RESOLVE_CALVING_SELECTION = gql`
  mutation ResolveCalvingSelection(
    $calvingId: ID!
    $hasCalved: Boolean!
    $resolutionInput: CalvingResolutionInput
  ) {
    resolveCalvingSelection(
      calvingId: $calvingId
      hasCalved: $hasCalved
      resolutionInput: $resolutionInput
    ) {
      success
      message
    }
  }
`;


export const CREATE_HEALTH = gql`
  mutation CreateHealth($animalId: ID!, $healthIndex: String!, $occurredAt: String) {
    createHealth(animalId: $animalId, healthIndex: $healthIndex, occurredAt: $occurredAt) {
      success
      message
    }
  }
`;

export const UPDATE_HEALTH = gql`
  mutation UpdateHealth($healthId: ID!, $input: HealthUpdateInput!) {
    updateHealth(healthId: $healthId, input: $input) {
      success
      message
    }
  }
`;

export const RESOLVE_HEALTH_SELECTION = gql`
  mutation ResolveHealthSelection($healthId: ID!, $isTreatmentDone: Boolean!, $treatmentDetails: TreatmentInput) {
    resolveHealthSelection(healthId: $healthId, isTreatmentDone: $isTreatmentDone, treatmentDetails: $treatmentDetails) {
      success
      message
    }
  }
`;

export const DELETE_HEALTH = gql`
  mutation DeleteHealth($healthId: ID!) {
    deleteHealth(healthId: $healthId) {
      success
      message
    }
  }
`;

export const ALL_EVENTS = gql`
 query GetAllEvents($filter: FilterInput, $options: OptionsInput) {
  getAllEvents(filter: $filter, options: $options) {
    items {
        __typename
        ... on CommonEvent {
          id
          occurredAt
          daysAgo

            animal {
          id
          name
          tagNo
          activeTag {
            deviceNo
          }
        }

          isActive
          note
        }
        ... on Heat {
        id
          heatStrength
           occurredAt
          daysAgo

            animal {
          id
          name
          tagNo
          activeTag {
            deviceNo
          }
        }

          isActive
          note
        }
        ... on Health {
        id
          healthIndex
           occurredAt
          daysAgo

            animal {
          id
          name
          tagNo
          activeTag {
            deviceNo
          }
        }

          isActive
          note
        }
      }
      totalCount
  }
}
`;

