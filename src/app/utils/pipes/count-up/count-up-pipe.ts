import { Pipe, PipeTransform } from '@angular/core';
import { map, startWith, take, tap } from 'rxjs/operators';
import { Observable, interval, animationFrameScheduler } from 'rxjs';

@Pipe({
  name: 'countUp',
  standalone: true
})
export class CountUpPipe implements PipeTransform {
  // transform(endValue: number, duration: number = 1000): Observable<number> {
  //   const steps = 30; // Number of increments
  //   const stepDuration = duration / steps;
    
  //   return interval(stepDuration, animationFrameScheduler).pipe(
  //     map(i => Math.round(endValue * (i + 1) / steps)),
  //     take(steps),
  //     startWith(0)
  //   );
  // }

  // Add a private variable to the pipe class to track state
private lastValue: number = 0;

transform(endValue: number | null | undefined, duration: number = 1000): Observable<number> {
  const final = endValue ?? 0;
  const start = this.lastValue;
  this.lastValue = final; // Save for next time

  const steps = 30;
  return interval(duration / steps).pipe(
    map(i => {
      const progress = (i + 1) / steps;
      return Math.round(start + (final - start) * progress);
    }),
    take(steps),
    startWith(start)
  );
}
}