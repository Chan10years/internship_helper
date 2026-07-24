export interface JobAccessCopy {
  listAction: string;
  detailState: string;
  detailDescription: string;
}

export function accessCopy(isAuthenticated: boolean): JobAccessCopy;
