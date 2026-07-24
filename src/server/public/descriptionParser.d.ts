export interface DescriptionGroup {
  title: string;
  items: string[];
}

export function parseJobDescription(text: string): DescriptionGroup[];
