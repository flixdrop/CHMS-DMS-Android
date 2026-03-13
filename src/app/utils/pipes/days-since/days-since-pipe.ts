import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'daysSince',
  standalone: true // Set to false if you are using NgModules
})
export class DaysSincePipe implements PipeTransform {

  transform(pastDate: any): string {
    if (!pastDate) return '';

    let dateObj: Date;

    // Handle string timestamps
    if (typeof pastDate === 'string' && !isNaN(Number(pastDate))) {
      const num = Number(pastDate);
      dateObj = new Date(num < 10000000000 ? num * 1000 : num);
    } else {
      dateObj = new Date(pastDate);
    }

    if (isNaN(dateObj.getTime())) return '';

    const diffMs = new Date().getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
    if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    if (diffDays >= 1) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    return 'less than a day ago';
  }
}