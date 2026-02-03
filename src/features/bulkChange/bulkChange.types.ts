export type BulkField = "department" | "managerId" | "location" | "title";

export type ApplyValues = Partial<Record<BulkField, string>>;

export type Overrides = Record<string, Partial<Record<BulkField, string>>>;
