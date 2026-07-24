
import { gql } from "apollo-angular";

export const DASHBOARD_ITEMS = gql`
  query GetDashboardCounts($filter: FilterInput) {
    getDashboardCounts(filter: $filter) {
      totalAnimals
      totalHealths
      totalRecoveries
      totalHeats
      totalInseminations
      totalPregnancies
      totalCalvings
      totalDryoffEvents
      totalLactations
      totalReproductions
    }
  }
`;