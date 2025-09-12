export type Collection = {
  name: string;
  uuid: string;
  metadata: {
    description?: string;
    [key: string]: any;
  };
};

export type CollectionCreate = {
  name: string;
  metadata: Record<string, any>;
};
