import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'utcToIst',
  standalone: true
})
export class UtcToIstPipe implements PipeTransform {

  transform(value: any): string {
    if (!value) return 'N/A';

    try {
      let dateObj: Date;

      // Check if value is a string that only contains numbers
      if (typeof value === 'string' && !isNaN(Number(value))) {
        value = Number(value);
      }

      if (value instanceof Date) {
        dateObj = value;
      } else if (typeof value === 'number') {
        // 10 digits = seconds, 13 digits = milliseconds
        dateObj = value < 10000000000 ? new Date(value * 1000) : new Date(value);
      } else {
        // Handles ISO Strings
        dateObj = new Date(value);
      }

      if (isNaN(dateObj.getTime())) return 'Invalid Date';

      // return new Intl.DateTimeFormat('en-IN',  {
      //   timeZone: 'Asia/Kolkata',
      //   day: '2-digit',
      //   month: '2-digit',
      //   year: '2-digit',
      //   hour: '2-digit',
      //   minute: '2-digit',
      //   hour12: true
      // }).format(dateObj).toUpperCase();

      return new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: '2-digit',
  year: '2-digit'
}).format(dateObj)
+ '\n' +
new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
}).format(dateObj).toUpperCase();
      
    } catch (e) {
      return 'Error';
    }
  }
}