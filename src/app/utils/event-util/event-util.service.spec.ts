import { TestBed } from '@angular/core/testing';

import { EventUtilityService } from './event-util.service';

describe('EventUtilityService', () => {
  let service: EventUtilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventUtilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
