import { TestBed } from '@angular/core/testing';

import { OfflineManager } from './offline-manager';

describe('OfflineManager', () => {
  let service: OfflineManager;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfflineManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
