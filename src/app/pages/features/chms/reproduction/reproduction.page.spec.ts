import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReproductionPage } from './reproduction.page';

describe('ReproductionPage', () => {
  let component: ReproductionPage;
  let fixture: ComponentFixture<ReproductionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReproductionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
