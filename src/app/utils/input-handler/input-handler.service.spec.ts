import { TestBed } from '@angular/core/testing';

import { InputHandlerService } from './input-handler.service';

describe('InputHandlerService', () => {
  let service: InputHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InputHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
