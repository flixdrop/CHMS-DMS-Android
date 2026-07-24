import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable, catchError, throwError, filter, firstValueFrom } from 'rxjs';
import { 
  ALL_EVENTS, CREATE_HEALTH, DELETE_HEALTH, GET_ACTIVE_CYCLES, GET_CALVINGS, 
  GET_DRYOFFS, GET_HEALTHS, GET_HEATS, GET_INSEMINATIONS, GET_LACTATIONS, 
  GET_PREGNANCIES, GET_RECOVERIES, GET_REPRODUCTIONS, RESOLVE_CALVING_SELECTION, RESOLVE_HEALTH_SELECTION, RESOLVE_HEAT_SELECTION, RESOLVE_PREGNANCY_SELECTION, UPDATE_HEALTH 
} from 'src/app/graphql/queries/event.queries';

export interface InseminationInputPayload {
  animalId: string;
  process: string;
  occurredAt?: string;
  technicianName?: string | null;
  bullName?: string | null;
  semenType?: string | null;
  semenCompany?: string | null;
  semenBreed?: string | null;
  semenBatchNumber?: string | null;
}

export interface CancellationInputPayload {
  reasonCategory: string;
  healthIssueType?: string | null;
  remarks: string;
}


export interface ConfirmationInput {
  animalId: string;
  method: string;
  checkedAt: string;
  examinerName?: string | null;
  expectedCalvingDate?: string | null;
  note?: string | null;
}

export interface CancellationInput {
  reasonCategory: string;
  nextAction: string;
  remarks: string;
}

export interface PregnancyResolutionInput {
  occurredAt?: string;
  failureReason?: string;
  note?: string;
  confirmationInput?: ConfirmationInput | null;
  cancellationInput?: CancellationInput | null;
}

export interface ResponseMessage {
  success: boolean;
  message: string;
}

export interface ResolvePregnancyParams {
  pregnancyId: string;
  hasCalved: boolean;
  resolutionInput?: PregnancyResolutionInput;
}

@Injectable({
  providedIn: 'root',
})
export class CattleMonitoringService {
  private readonly apollo = inject(Apollo);

  /**
   * Universal execution wrapper for watched query streams
   */
  private watchApolloQuery<T>(
    query: any,
    variables: any,
    dataKey: string,
  ): Observable<T> {
    return this.apollo
      .watchQuery<any>({
        query,
        variables,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        filter((result) => !!result.data && result.data[dataKey] !== undefined),
        map((result) => result.data[dataKey] as T),
        catchError((error) => {
          console.error(`[API Error] Active cattle monitoring stream failed for ${dataKey}:`, error);
          return throwError(() => error);
        })
      );
  }

  /* -------------------------------------------------------------------------- */
  /* Read & Dynamic Stream Accessors                       */
  /* -------------------------------------------------------------------------- */

  getHealths(inputs: any): Observable<any> {
    return this.watchApolloQuery<any>(GET_HEALTHS, inputs, 'getHealths');
  }

  getRecoveries(inputs: any): Observable<any> {
    return this.watchApolloQuery<any>(GET_RECOVERIES, inputs, 'getRecoveries');
  }

  getHeats(inputs: any): Observable<any> {
    return this.watchApolloQuery<any>(GET_HEATS, inputs, 'getHeats');
  }

  getInseminations(inputs: any): Observable<any> {
    return this.watchApolloQuery<any>(GET_INSEMINATIONS, inputs, 'getInseminations');
  }

  getPregnancies(inputs: any): Observable<any> {
    return this.watchApolloQuery<any>(GET_PREGNANCIES, inputs, 'getPregnancies');
  }

  getCalvings(inputs: any): Observable<any> {
    return this.watchApolloQuery<any>(GET_CALVINGS, inputs, 'getCalvings');
  }

  getDryoffs(inputs: any): Observable<any> {
    return this.watchApolloQuery<any>(GET_DRYOFFS, inputs, 'getDryoffs');
  }

  getLactations(inputs: any): Observable<any> {
    return this.watchApolloQuery<any>(GET_LACTATIONS, inputs, 'getLactations');
  }

  getReproductions(inputs: any): Observable<any> {
    return this.watchApolloQuery<any>(GET_REPRODUCTIONS, inputs, 'getReproductions');
  }

  getActiveCycles(inputs: any): Observable<any> {
    return this.watchApolloQuery<any>(GET_ACTIVE_CYCLES, inputs, 'getActiveCycles');
  }

  getAllEvents(inputs: { filter: any; options: any }): Observable<any> {
    return this.watchApolloQuery<any>(ALL_EVENTS, inputs, 'getAllEvents');
  }

  /* -------------------------------------------------------------------------- */
  /* Transactional Breeding Lifecycles                         */
  /* -------------------------------------------------------------------------- */

  confirmInsemination(data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation ConfirmInsemination($heatEventId: ID!, $input: InseminationInput!) {
          deactivateEvent(eventId: $heatEventId, type: "Heat") { success message }
          createInsemination(input: $input) { success message }
        }
      `,
      variables: {
        heatEventId: data.heat.id,
        input: {
          animalId: data.heat.animal.id,
          process: data.insemination_form.process,
          bullName: data.insemination_form.bull_name,
          semenType: data.insemination_form.semen_type,
          semenCompany: data.insemination_form.semen_company,
          semenBreed: data.insemination_form.semen_breed,
          occurredAt: data.insemination_form.insemination_date
        }
      },
      refetchQueries: ['GetInseminations', 'GetDashboardCounts', 'GetHeats']
    });
  }

  reportInseminationFailure(data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation ReportInseminationFailure($eventId: ID!, $note: String) {
          reportInseminationFailure(eventId: $eventId, note: $note) { success message }
        }
      `,
      variables: {
        eventId: data.heat.id,
        note: data.insemination_form.note
      },
      refetchQueries: ['GetDashboardCounts', 'GetHeats']
    });
  }

  confirmPregnancy(data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation ConfirmPregnancy($inseminationId: ID!, $animalId: ID!, $occurredAt: String!) {
          deactivateEvent(eventId: $inseminationId, type: "Insemination") { success message }
          createPregnancy(animalId: $animalId, result: "POSITIVE", occurredAt: $occurredAt) { success message }
        }
      `,
      variables: {
        inseminationId: data.insemination.id,
        animalId: data.insemination.animal.id,
        occurredAt: data.occurredAtTime
      },
      refetchQueries: ['GetPregnancies', 'GetDashboardCounts', 'GetInseminations']
    });
  }

  reportPregnancyFailure(data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation ReportPregnancyFailure($eventId: ID!) {
          reportPregnancyFailure(eventId: $eventId) { success message }
        }
      `,
      variables: { eventId: data.insemination.id },
      refetchQueries: ['GetDashboardCounts', 'GetInseminations']
    });
  }

  confirmCalved(data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation ConfirmCalved($pregnancyCheckId: ID!, $animalId: ID!, $occurredAt: String!) {
          deactivateEvent(eventId: $pregnancyCheckId, type: "Pregnancy") { success message }
          createCalving(animalId: $animalId, occurredAt: $occurredAt) { success message }
        }
      `,
      variables: {
        pregnancyCheckId: data.pregnancy_check.id,
        animalId: data.pregnancy_check.animal.id,
        occurredAt: data.occurredAtTime
      },
      refetchQueries: ['GetCalvings', 'GetDashboardCounts', 'GetActiveCycles', 'GetPregnancies']
    });
  }

  reportMisscarriage(data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation ReportMisscarriage($eventId: ID!, $note: String) {
          reportMisscarriage(eventId: $eventId, note: $note) { success message }
        }
      `,
      variables: {
        eventId: data.pregnancy_check.id,
        note: data.misscarriageForm.note
      },
      refetchQueries: ['GetDashboardCounts', 'GetPregnancies']
    });
  }

  /* -------------------------------------------------------------------------- */
  /* Independent Event Operations                              */
  /* -------------------------------------------------------------------------- */

  createHeat(variables: { animalId: string; heatStrength: string; occurredAt: string; isSilent: boolean }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation CreateHeat($animalId: ID!, $heatStrength: String!, $occurredAt: String, $isSilent: Boolean) {
          createHeat(animalId: $animalId, heatStrength: $heatStrength, occurredAt: $occurredAt, isSilent: $isSilent) {
            success
            message
          }
        }
      `,
      variables,
      refetchQueries: ['GetHeats', 'GetDashboardCounts']
    }).pipe(map(res => res.data?.createHeat));
  }

  updateHeat(variables: { heatId: string; heatStrength: string; isSilentHeat: boolean; occurredAt: string; note: string }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation UpdateHeat($heatId: ID!, $heatStrength: String!, $isSilentHeat: Boolean, $occurredAt: String!, $note: String) {
          updateHeat(heatId: $heatId, heatStrength: $heatStrength, isSilentHeat: $isSilentHeat, occurredAt: $occurredAt, note: $note) {
            success
            message
          }
        }
      `,
      variables,
      refetchQueries: ['GetHeats']
    }).pipe(map(res => res.data?.updateHeat));
  }

  deleteHeat(heatId: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation DeleteHeat($heatId: ID!) {
          deleteHeat(heatId: $heatId) {
            success
            message
          }
        }
      `,
      variables: { heatId },
      refetchQueries: ['GetHeats', 'GetDashboardCounts']
    }).pipe(map(res => res.data?.deleteHeat));
  }

  resolveHeatSelection(variables: { heatId: string; inseminationInput: any }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation ResolveHeatSelection($heatId: ID!, $inseminationInput: InseminationInput) {
          resolveHeatSelection(heatId: $heatId, inseminationInput: $inseminationInput) {
            success
            message
          }
        }
      `,
      variables,
      refetchQueries: ['GetHeats', 'GetInseminations', 'GetDashboardCounts']
    }).pipe(map(res => res.data?.resolveHeatSelection));
  }

  /**
   * Resolves a heat event by either logging insemination or recording a cancellation.
   */
  async resolveHeatEvent(
    heatId: string,
    inseminationInput?: InseminationInputPayload | null,
    cancellationInput?: CancellationInputPayload | null
  ): Promise<{ success: boolean; message: string }> {
    const res = await firstValueFrom(
      this.apollo.mutate<{ resolveHeatSelection: { success: boolean; message: string } }>({
        mutation: RESOLVE_HEAT_SELECTION,
        variables: {
          heatId,
          inseminationInput: inseminationInput || null,
          cancellationInput: cancellationInput || null
        },
        refetchQueries: ['GetHeatEvents', 'GetDashboardCounts'] // Auto refresh listing & counts
      })
    );

    return res.data!.resolveHeatSelection;
  }

  // resolvePregnancyEvent(
  //   pregnancyId: string,
  //   hasCalved: boolean,
  //   resolutionInput?: PregnancyResolutionInput
  // ): Observable<ResponseMessage> {
  //   return this.apollo.mutate<{ resolvePregnancySelection: ResponseMessage }>({
  //     mutation: RESOLVE_PREGNANCY_SELECTION,
  //     variables: {
  //       pregnancyId,
  //       hasCalved,
  //       resolutionInput
  //     },
  //     refetchQueries: ['GetDashboardCounts', 'GetActivePregnancies', 'GetAnimalHistory']
  //   }).pipe(
  //     map(result => {
  //       if (result.data?.resolvePregnancySelection) {
  //         return result.data.resolvePregnancySelection;
  //       }
  //       throw new Error('No response returned from server');
  //     })
  //   );
  // }


  resolvePregnancyEvent({
    pregnancyId,
    hasCalved,
    resolutionInput
  }: ResolvePregnancyParams): Observable<ResponseMessage> {
    return this.apollo.mutate<{ resolvePregnancySelection: ResponseMessage }>({
      mutation: RESOLVE_PREGNANCY_SELECTION,
      variables: {
        pregnancyId,
        hasCalved,
        resolutionInput
      },
      refetchQueries: ['GetDashboardCounts', 'GetActivePregnancies', 'GetAnimalHistory']
    }).pipe(
      map(result => {
        if (result.data?.resolvePregnancySelection) {
          return result.data.resolvePregnancySelection;
        }
        throw new Error('No response returned from server');
      })
    );
  }

  createInsemination(variables: { input: any }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation CreateInsemination($input: InseminationInput) {
          createInsemination(input: $input) {
            success
            message
          }
        }
      `,
      variables,
      refetchQueries: ['GetInseminations', 'GetDashboardCounts']
    }).pipe(map(res => res.data?.createInsemination));
  }

  updateInsemination(variables: { inseminationId: string; process: string; bullName: string | null; company: string | null; breed: string | null; type: string | null; occurredAt: string; note: string }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation UpdateInsemination($inseminationId: ID!, $process: String!, $bullName: String, $company: String, $breed: String, $type: String, $occurredAt: String!, $note: String) {
          updateInsemination(inseminationId: $inseminationId, process: $process, bullName: $bullName, company: $company, breed: $breed, type: $type, occurredAt: $occurredAt, note: $note) {
            success
            message
          }
        }
      `,
      variables,
      refetchQueries: ['GetInseminations']
    });
  }

  deleteInsemination(inseminationId: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation DeleteInsemination($inseminationId: ID!) {
          deleteInsemination(inseminationId: $inseminationId) {
            success
            message
          }
        }
      `,
      variables: { inseminationId },
      refetchQueries: ['GetInseminations', 'GetDashboardCounts']
    });
  }

  createPregnancy(variables: { animalId: string; result: string; occurredAt: string }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation CreatePregnancy($animalId: ID!, $result: String, $occurredAt: String) {
          createPregnancy(animalId: $animalId, result: $result, occurredAt: $occurredAt) {
            success
            message
          }
        }
      `,
      variables,
      refetchQueries: ['GetPregnancies', 'GetDashboardCounts']
    });
  }

  updatePregnancy(payload: { pregnancyId: string; input: any }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation UpdatePregnancy($pregnancyId: ID!, $input: PregnancyUpdateInput!) {
          updatePregnancy(pregnancyId: $pregnancyId, input: $input) {
            success
            message
          }
        }
      `,
      variables: payload,
      refetchQueries: ['GetPregnancies']
    });
  }

  deletePregnancy(pregnancyId: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation DeletePregnancy($pregnancyId: ID!) {
          deletePregnancy(pregnancyId: $pregnancyId) {
            success
            message
          }
        }
      `,
      variables: { pregnancyId },
      refetchQueries: ['GetPregnancies', 'GetDashboardCounts']
    });
  }

  resolvePregnancySelection(payload: { pregnancyId: string; hasCalved: boolean; resolutionInput: any }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation ResolvePregnancySelection($pregnancyId: ID!, $hasCalved: Boolean!, $resolutionInput: PregnancyResolutionInput) {
          resolvePregnancySelection(pregnancyId: $pregnancyId, hasCalved: $hasCalved, resolutionInput: $resolutionInput) {
            success
            message
          }
        }
      `,
      variables: payload,
      refetchQueries: ['GetPregnancies', 'GetCalvings', 'GetDashboardCounts', 'GetActiveCycles']
    });
  }

  deactivateEvent(eventId: string, type: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation DeactivateEvent($eventId: ID!, $type: String) {
          deactivateEvent(eventId: $eventId, type: $type) {
            success
            message
          }
        }
      `,
      variables: { eventId, type },
      refetchQueries: ['GetDashboardCounts', 'GetHeats', 'GetInseminations', 'GetPregnancies', 'GetHealths']
    });
  }

  /* -------------------------------------------------------------------------- */
  /* Clinical Treatment & Diagnostics Operations               */
  /* -------------------------------------------------------------------------- */

  reportTreatment(data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation ReportTreatment($input: ReportTreatmentInput!) {
          reportTreatment(input: $input) { success message }
        }
      `,
      variables: {
        input: {
          healthId: data.health.id,
          treatmentType: data.treatment_form.treatmentType,
          medicine: data.treatment_form.medicine,
          nutrition: data.treatment_form.nutrition,
          prescriptionRef: data.treatment_form.prescriptionRef
        }
      },
      refetchQueries: ['GetHealths', 'GetRecoveries']
    });
  }

  reportTreatmentFailure(data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: gql`
        mutation ReportTreatmentFailure($healthEventId: ID!, $note: String) {
          reportTreatmentFailure(healthId: $healthEventId, note: $note) { success message }
        }
      `,
      variables: {
        healthEventId: data.health.id,
        note: data.reason
      },
      refetchQueries: ['GetHealths', 'GetRecoveries']
    });
  }

  createHealth(variables: { animalId: string; healthIndex: string; occurredAt?: string }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: CREATE_HEALTH,
      variables
    }).pipe(map(res => res.data.createHealth));
  }

  updateHealth(variables: { healthId: string; input: any }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: UPDATE_HEALTH,
      variables
    }).pipe(map(res => res.data.updateHealth));
  }

  resolveHealthSelection(variables: { healthId: string; isTreatmentDone: boolean; treatmentDetails?: any | null }): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: RESOLVE_HEALTH_SELECTION,
      variables
    }).pipe(map(res => res.data.resolveHealthSelection));
  }

  deleteHealth(healthId: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: DELETE_HEALTH,
      variables: { healthId }
    }).pipe(map(res => res.data.deleteHealth));
  }

  /**
   * Fetches the base64 metadata payload of an upload attachment via Apollo Standalone Client
   */
  public getPrescriptionAttachment(prescriptionRef: string): Observable<any> {
    return this.apollo.query<any>({
      query: gql`
        query GetPrescriptionAttachment($prescriptionRef: String!) {
          getPrescriptionAttachment(prescriptionRef: $prescriptionRef) {
            success
            message
            filename
            mimeType
            base64Data
          }
        }
      `,
      variables: { prescriptionRef },
      fetchPolicy: 'network-only' // Ensures we pull fresh base64 stream allocations instead of hit cache boundaries
    }).pipe(
      map(res => res?.data?.getPrescriptionAttachment),
      catchError((error) => {
        console.error('[API Error] Failed to stream attachment payload via Apollo:', error);
        return throwError(() => error);
      })
    );
  }

  resolveCalvingSelection(
    calvingId: string, 
    hasCalved: boolean, 
    resolutionInput: any
  ): Observable<any> {
    return this.apollo.mutate({
      mutation: RESOLVE_CALVING_SELECTION,
      variables: {
        calvingId,
        hasCalved,
        resolutionInput
      },
      refetchQueries: ['GetDashboardCounts', 'GetActivePregnancies', 'GetAnimalHistory', 'GetCalvings']
    });
  }

}