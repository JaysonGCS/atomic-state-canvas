export type THierarchyItem =
  | {
      id: string;
      label: string;
      type: 'item';
    }
  | {
      id: string;
      label: string;
      type: 'group';
      children: THierarchyItem[];
    };
